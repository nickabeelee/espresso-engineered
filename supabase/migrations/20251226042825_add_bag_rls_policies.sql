-- Migration: Add RLS policies for bag table
-- Purpose: Enable proper access control for user-owned bag entities
-- Affected tables: bag (add RLS policies)

-- SELECT policy: Users can view all bags (public by default for community sharing)
CREATE POLICY "Bags are viewable by everyone" 
ON public.bag 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create bags they own
CREATE POLICY "Users can create their own bags" 
ON public.bag 
FOR INSERT 
TO authenticated 
WITH CHECK ((SELECT auth.uid()) = owner_id);

-- UPDATE policy: Users can only update their own bags
CREATE POLICY "Users can update their own bags" 
ON public.bag 
FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = owner_id) 
WITH CHECK ((SELECT auth.uid()) = owner_id);

-- DELETE policy: Users can only delete their own bags
CREATE POLICY "Users can delete their own bags" 
ON public.bag 
FOR DELETE 
TO authenticated 
USING ((SELECT auth.uid()) = owner_id);;
