// src/types/index.ts
export interface Branch {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Semester {
  id: string
  branch_id: string
  number: number
  created_at: string
}

export interface Course {
  id: string
  semester_id: string
  name: string
  code: string | null
  created_at: string
}

export interface Unit {
  id: string
  course_id: string
  title: string
  order_index: number
  created_at: string
}

export interface Topic {
  id: string
  unit_id: string
  title: string
  order_index: number
  created_at: string
}

export interface Note {
  id: string
  topic_id: string
  title: string
  file_url: string
  file_type: 'pdf' | 'image' | 'link'
  created_at: string
}