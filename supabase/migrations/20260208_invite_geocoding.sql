-- Add geocoding columns to invites table for map display before registration
ALTER TABLE invites ADD COLUMN IF NOT EXISTS target_lat double precision;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS target_lng double precision;
