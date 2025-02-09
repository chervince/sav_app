/*
  # Configuration des tables pour le système SAV

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - ID de l'utilisateur
      - `name` (text) - Nom du revendeur
      - `company` (text) - Nom de l'entreprise
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sav_tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `customer_name` (text)
      - `email` (text)
      - `phone` (text)
      - `product_type` (text)
      - `serial_number` (text)
      - `description` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `sav_notes`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  company text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create SAV tickets table
CREATE TABLE IF NOT EXISTS sav_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  product_type text NOT NULL,
  serial_number text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create SAV notes table
CREATE TABLE IF NOT EXISTS sav_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES sav_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sav_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sav_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view all tickets"
  ON sav_tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own tickets"
  ON sav_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON sav_tickets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets"
  ON sav_tickets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all notes"
  ON sav_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert notes"
  ON sav_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle ticket updates
CREATE OR REPLACE FUNCTION handle_ticket_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ticket updates
CREATE TRIGGER update_sav_ticket_timestamp
  BEFORE UPDATE ON sav_tickets
  FOR EACH ROW
  EXECUTE FUNCTION handle_ticket_update();