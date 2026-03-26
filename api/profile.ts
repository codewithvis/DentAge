import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";

export const useProfile = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId, 
  });
};
