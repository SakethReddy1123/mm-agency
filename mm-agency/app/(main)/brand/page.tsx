import { BrandManager } from "./components/BrandManager";

export default function BrandPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">Brand</h1>
      <p className="mt-1 text-zinc-500">Manage brands.</p>
      <div className="mt-8">
        <BrandManager />
      </div>
    </div>
  );
}
