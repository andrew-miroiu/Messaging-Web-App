import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://pctitrkhtozxrgfbovzu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGl0cmtodG96eHJnZmJvdnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MzQzNDMsImV4cCI6MjA3NzMxMDM0M30.hWltl913rdCH9fZHC3IWU-GUBzQBBmejXFfHWedEoLU'
)
