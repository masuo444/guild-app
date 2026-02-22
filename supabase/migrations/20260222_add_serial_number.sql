-- Add serial_number column to profiles table
ALTER TABLE profiles ADD COLUMN serial_number INTEGER UNIQUE;
