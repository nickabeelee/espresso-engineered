-- Migration: Add RLS policies for remaining tables
-- Purpose: Complete RLS setup for all tables in the system
-- Affected tables: roaster, bean, grinder, machine, brew

-- ============================================================================
-- ROASTER TABLE POLICIES
-- ============================================================================

-- SELECT policy: Roasters are viewable by everyone (community shared)
CREATE POLICY "Roasters are viewable by everyone" 
ON public.roaster 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create roasters
CREATE POLICY "Authenticated users can create roasters" 
ON public.roaster 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE policy: Authenticated users can update roasters (community editable)
CREATE POLICY "Authenticated users can update roasters" 
ON public.roaster 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- DELETE policy: Only admins can delete roasters (handled by application logic)
CREATE POLICY "Admins can delete roasters" 
ON public.roaster 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.barista 
    WHERE id = (SELECT auth.uid()) AND is_admin = true
  )
);

-- ============================================================================
-- BEAN TABLE POLICIES
-- ============================================================================

-- SELECT policy: Beans are viewable by everyone (community shared)
CREATE POLICY "Beans are viewable by everyone" 
ON public.bean 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create beans
CREATE POLICY "Authenticated users can create beans" 
ON public.bean 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE policy: Authenticated users can update beans (community editable)
CREATE POLICY "Authenticated users can update beans" 
ON public.bean 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- DELETE policy: Only admins can delete beans (handled by application logic)
CREATE POLICY "Admins can delete beans" 
ON public.bean 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.barista 
    WHERE id = (SELECT auth.uid()) AND is_admin = true
  )
);

-- ============================================================================
-- GRINDER TABLE POLICIES
-- ============================================================================

-- SELECT policy: Grinders are viewable by everyone (community shared)
CREATE POLICY "Grinders are viewable by everyone" 
ON public.grinder 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create grinders
CREATE POLICY "Authenticated users can create grinders" 
ON public.grinder 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE policy: Authenticated users can update grinders (community editable)
CREATE POLICY "Authenticated users can update grinders" 
ON public.grinder 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- DELETE policy: Only admins can delete grinders (handled by application logic)
CREATE POLICY "Admins can delete grinders" 
ON public.grinder 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.barista 
    WHERE id = (SELECT auth.uid()) AND is_admin = true
  )
);

-- ============================================================================
-- MACHINE TABLE POLICIES
-- ============================================================================

-- SELECT policy: Machines are viewable by everyone (community shared)
CREATE POLICY "Machines are viewable by everyone" 
ON public.machine 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create machines
CREATE POLICY "Authenticated users can create machines" 
ON public.machine 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- UPDATE policy: Authenticated users can update machines (community editable)
CREATE POLICY "Authenticated users can update machines" 
ON public.machine 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- DELETE policy: Only admins can delete machines (handled by application logic)
CREATE POLICY "Admins can delete machines" 
ON public.machine 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.barista 
    WHERE id = (SELECT auth.uid()) AND is_admin = true
  )
);

-- ============================================================================
-- BREW TABLE POLICIES
-- ============================================================================

-- SELECT policy: Brews are viewable by everyone (public by default)
CREATE POLICY "Brews are viewable by everyone" 
ON public.brew 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create their own brews
CREATE POLICY "Users can create their own brews" 
ON public.brew 
FOR INSERT 
TO authenticated 
WITH CHECK ((SELECT auth.uid()) = barista_id);

-- UPDATE policy: Users can only update their own brews
CREATE POLICY "Users can update their own brews" 
ON public.brew 
FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = barista_id) 
WITH CHECK ((SELECT auth.uid()) = barista_id);

-- DELETE policy: Users can only delete their own brews
CREATE POLICY "Users can delete their own brews" 
ON public.brew 
FOR DELETE 
TO authenticated 
USING ((SELECT auth.uid()) = barista_id);;
