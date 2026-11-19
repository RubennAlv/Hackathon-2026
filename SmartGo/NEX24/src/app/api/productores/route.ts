import database from "@/lib/database";

function normalizeRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contactName: row.contactName,
    phone: row.phone,
    category: row.category,
    products: JSON.parse(String(row.products)),
    retailPrice: row.retailPrice,
    wholesalePrice: row.wholesalePrice,
    capacity: row.capacity,
    minimumOrder: row.minimumOrder,
    deliveryDays: row.deliveryDays,
    deliveryTime: row.deliveryTime,
    location: row.location,
    zone: row.zone,
    photo: row.photo,
    available: Boolean(row.available),
    rating: row.rating,
    createdAt: row.createdAt,
  };
}

export async function GET() {
  const rows = database.prepare("SELECT * FROM productores ORDER BY createdAt DESC").all() as Record<string, unknown>[];
  return Response.json({ productores: rows.map(normalizeRow) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["name", "description", "contactName", "phone", "category", "products", "retailPrice", "wholesalePrice", "capacity", "minimumOrder", "deliveryDays", "deliveryTime", "location"];
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
    if (missing.length) return Response.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });

    const retailPrice = Number(body.retailPrice);
    const wholesalePrice = Number(body.wholesalePrice);
    const capacity = Number(body.capacity);
    const minimumOrder = Number(body.minimumOrder);
    if (!Number.isFinite(retailPrice) || !Number.isFinite(wholesalePrice) || retailPrice <= 0 || wholesalePrice <= 0) {
      return Response.json({ error: "Los precios deben ser mayores a cero." }, { status: 400 });
    }
    if (!Number.isFinite(capacity) || !Number.isFinite(minimumOrder) || capacity < 1 || minimumOrder < 1) {
      return Response.json({ error: "La capacidad y el pedido mínimo deben ser mayores a cero." }, { status: 400 });
    }

    const products = Array.isArray(body.products) ? body.products : String(body.products).split(",").map((value: string) => value.trim()).filter(Boolean);
    if (!products.length) return Response.json({ error: "Agrega al menos un producto." }, { status: 400 });

    const id = `${Date.now()}-${String(body.name).toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
    database.prepare(`INSERT INTO productores (
      id, name, description, contactName, phone, category, products, retailPrice, wholesalePrice,
      capacity, minimumOrder, deliveryDays, deliveryTime, location, zone, photo, available, rating, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`).run(
      id, String(body.name).trim(), String(body.description).trim(), String(body.contactName).trim(), String(body.phone).trim(),
      String(body.category), JSON.stringify(products), retailPrice, wholesalePrice, capacity, minimumOrder,
      String(body.deliveryDays), String(body.deliveryTime), String(body.location).trim(), String(body.zone || body.location).trim(),
      body.photo ? String(body.photo) : null, new Date().toISOString()
    );

    const row = database.prepare("SELECT * FROM productores WHERE id = ?").get(id) as Record<string, unknown>;
    return Response.json({ productor: normalizeRow(row) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "No se pudo guardar el productor." }, { status: 500 });
  }
}
