-- Add QA fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS qa_status text DEFAULT 'pending' CHECK (qa_status IN ('pending', 'in_progress', 'verified', 'failed')),
ADD COLUMN IF NOT EXISTS qa_notes text;
