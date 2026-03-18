export type Customer = {
  id: string;
  image_url: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type BrandForOrder = { id: string; name: string; logo_url: string | null };

export type ProductForOrder = {
  id: string;
  brand_id: string;
  name: string;
  price: string;
  stock_count: number;
  image_url: string | null;
  brand_name: string;
};
