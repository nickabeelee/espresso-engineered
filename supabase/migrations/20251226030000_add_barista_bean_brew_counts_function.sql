-- Create function to get brew counts per bean for a barista
-- This helps determine "most used by me" beans efficiently

CREATE OR REPLACE FUNCTION get_barista_bean_brew_counts(barista_id_param uuid)
RETURNS TABLE (
  bean_id uuid,
  brew_count bigint
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    bag.bean_id,
    COUNT(brew.id) as brew_count
  FROM bag
  LEFT JOIN brew ON brew.bag_id = bag.id
  WHERE bag.owner_id = barista_id_param
  GROUP BY bag.bean_id
  HAVING COUNT(brew.id) > 0
  ORDER BY brew_count DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_barista_bean_brew_counts(uuid) TO authenticated;