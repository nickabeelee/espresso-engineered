-- Enable RLS on barista table (already enabled, but explicit for clarity)
ALTER TABLE public.barista ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Anyone can view barista profiles (public by default)
CREATE POLICY "Barista profiles are viewable by everyone" 
ON public.barista 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- INSERT policy: Authenticated users can create their own barista profile
CREATE POLICY "Users can create their own barista profile" 
ON public.barista 
FOR INSERT 
TO authenticated 
WITH CHECK ((SELECT auth.uid()) = id);

-- UPDATE policy: Baristas can only update their own profile
CREATE POLICY "Baristas can update their own profile" 
ON public.barista 
FOR UPDATE 
TO authenticated 
USING ((SELECT auth.uid()) = id) 
WITH CHECK ((SELECT auth.uid()) = id);

-- DELETE policy: Baristas can only delete their own profile
CREATE POLICY "Baristas can delete their own profile" 
ON public.barista 
FOR DELETE 
TO authenticated 
USING ((SELECT auth.uid()) = id);