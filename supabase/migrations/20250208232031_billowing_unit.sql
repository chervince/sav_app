/*
  # Correction des politiques de sécurité pour les profils

  1. Changements
    - Ajout d'une politique permettant aux utilisateurs authentifiés de créer leur propre profil
    - Modification de la politique de mise à jour pour permettre aux utilisateurs de mettre à jour leur propre profil
*/

-- Politique pour permettre aux utilisateurs de créer leur propre profil
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Mise à jour de la politique existante pour la mise à jour des profils
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);