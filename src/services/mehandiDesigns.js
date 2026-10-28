import { supabase } from './supabase'

export const MAX_PER_CATEGORY = 50
const BUCKET = 'mehandi-designs'
const MAX_FILE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const COLUMNS =
  'id, title, description, image_url, image_path, category_id, is_published, created_at'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('mehandi_categories')
    .select('id, name, sort_order')
    .order('sort_order')
  if (error) throw error
  return data
}

// Customers: only published designs. Admin: everything (Supabase allows it only for you).
export async function fetchDesigns(all = false) {
  let q = supabase.from('mehandi_designs').select(COLUMNS).order('created_at', { ascending: false })
  if (!all) q = q.eq('is_published', true)
  const { data, error } = await q
  if (error) throw error
  return data
}

function checkFile(file) {
  if (!file) throw new Error('Please choose a photo.')
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG or WebP photo.')
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`Photo must be under ${MAX_FILE_MB} MB.`)
}

async function uploadFile(file, categoryId) {
  checkFile(file)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${categoryId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

function friendly(error) {
  const msg = error?.message || 'Something went wrong.'
  if (msg.includes('already has 50')) return new Error('This category already has 50 designs. Delete one first.')
  if (msg.includes('row-level security')) return new Error('You do not have permission to do that.')
  if (msg.includes('foreign key') || msg.includes('violates')) {
    return new Error('This design has bookings, likes or comments. Unpublish it instead of deleting.')
  }
  return new Error(msg)
}

export async function uploadDesign({ file, title, description, categoryId }) {
  const { path, url } = await uploadFile(file, categoryId)
  const { data, error } = await supabase
    .from('mehandi_designs')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      category_id: categoryId,
      image_path: path,
      image_url: url,
      is_published: true,
    })
    .select(COLUMNS)
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]) // don't leave an orphan file
    throw friendly(error)
  }
  return data
}

export async function updateDesign(id, changes) {
  const { data, error } = await supabase
    .from('mehandi_designs')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(COLUMNS)
    .single()
  if (error) throw friendly(error)
  return data
}

export async function replaceDesignImage(design, file) {
  const { path, url } = await uploadFile(file, design.category_id)
  const { data, error } = await supabase
    .from('mehandi_designs')
    .update({ image_path: path, image_url: url, updated_at: new Date().toISOString() })
    .eq('id', design.id)
    .select(COLUMNS)
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw friendly(error)
  }
  await supabase.storage.from(BUCKET).remove([design.image_path])
  return data
}

export async function deleteDesign(design) {
  const { error } = await supabase.from('mehandi_designs').delete().eq('id', design.id)
  if (error) throw friendly(error)
  await supabase.storage.from(BUCKET).remove([design.image_path])
}