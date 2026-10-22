import { supabase } from './supabase'

const BUCKET = 'gallery'
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validatePhoto(file) {
  if (!file) return 'Please choose a photo.'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPG, PNG or WebP photos are allowed.'
  if (file.size > MAX_SIZE) return 'Photo is too large. Please choose one under 5 MB.'
  return ''
}

// All saved photos for one gallery, as { cardId: { url, path } }
export async function fetchGalleryPhotos(gallery) {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('card_id, image_url, image_path')
    .eq('gallery', gallery)
  if (error) throw error

  const photos = {}
  data.forEach((row) => {
    photos[row.card_id] = { url: row.image_url, path: row.image_path }
  })
  return photos
}

// Upload a new photo (or replace an old one) for one card
export async function saveGalleryPhoto(gallery, cardId, file, oldPath) {
  const problem = validatePhoto(file)
  if (problem) throw new Error(problem)

  const ext =
    file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const safeId = String(cardId).replace(/[^a-zA-Z0-9_-]/g, '-')
  const path = `${gallery}/${safeId}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  const url = urlData.publicUrl

  const { error: dbError } = await supabase.from('gallery_photos').upsert(
    {
      gallery,
      card_id: String(cardId),
      image_path: path,
      image_url: url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'gallery,card_id' }
  )
  if (dbError) {
    // the file was uploaded but not linked to the card, so remove it again
    await supabase.storage.from(BUCKET).remove([path])
    throw dbError
  }

  // after a successful replace, delete the previous file
  if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath])

  return { url, path }
}

// Remove the photo from a card
export async function deleteGalleryPhoto(gallery, cardId, path) {
  const { error: dbError } = await supabase
    .from('gallery_photos')
    .delete()
    .eq('gallery', gallery)
    .eq('card_id', String(cardId))
  if (dbError) throw dbError

  if (path) await supabase.storage.from(BUCKET).remove([path])
}