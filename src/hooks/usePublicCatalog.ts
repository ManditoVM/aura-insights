import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicProduct = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  brand: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category_id: string | null;
  categories: { name: string } | null;
};

/** Catálogo público: solo productos activos, protegido por las reglas de acceso. */
export function usePublicProducts() {
  return useQuery({
    queryKey: ["public-products"],
    queryFn: async (): Promise<PublicProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id,sku,name,description,brand,price,stock,image_url,category_id,categories(name)")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        price: Number(p.price),
        categories: Array.isArray(p.categories)
          ? ((p.categories[0] as { name: string } | undefined) ?? null)
          : ((p.categories as { name: string } | null) ?? null),
      })) as PublicProduct[];
    },
  });
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
