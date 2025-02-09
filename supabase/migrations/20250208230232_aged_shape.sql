/*
  # Ajout des rôles utilisateurs

  1. Modifications
    - Ajout du champ `role` à la table `profiles`
    - Valeurs possibles : 'parent' ou 'enfant'
    - Par défaut : 'enfant'
  
  2. Sécurité
    - Mise à jour des politiques RLS pour les tickets
    - Seuls les parents peuvent modifier/supprimer les tickets
    - Les enfants peuvent uniquement voir les tickets
*/

-- Ajout du champ role à la table profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'enfant' CHECK (role IN ('parent', 'enfant'));
  END IF;
END $$;

-- Mise à jour des politiques pour les tickets
DROP POLICY IF EXISTS "Users can update their own tickets" ON sav_tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON sav_tickets;

-- Nouvelles politiques pour les tickets
CREATE POLICY "Parents can update tickets"
  ON sav_tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );

CREATE POLICY "Parents can delete tickets"
  ON sav_tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
    )
  );