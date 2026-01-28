import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-5522dc1e/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== CLIENTS ENDPOINTS =====

// Get all clients
app.get("/make-server-5522dc1e/clients", async (c) => {
  try {
    const clients = await kv.getByPrefix("client:");
    return c.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

// Get single client
app.get("/make-server-5522dc1e/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const client = await kv.get(`client:${id}`);
    
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    return c.json({ client });
  } catch (error) {
    console.error("Error fetching client:", error);
    return c.json({ error: "Failed to fetch client" }, 500);
  }
});

// Create client
app.post("/make-server-5522dc1e/clients", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const client = {
      id,
      ...body,
      joinDate: new Date().toISOString(),
    };
    
    await kv.set(`client:${id}`, client);
    return c.json({ client }, 201);
  } catch (error) {
    console.error("Error creating client:", error);
    return c.json({ error: "Failed to create client" }, 500);
  }
});

// Update client
app.put("/make-server-5522dc1e/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingClient = await kv.get(`client:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    const updatedClient = {
      ...existingClient,
      ...body,
      id, // Keep original ID
    };
    
    await kv.set(`client:${id}`, updatedClient);
    return c.json({ client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

// Delete client
app.delete("/make-server-5522dc1e/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingClient = await kv.get(`client:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    await kv.del(`client:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// ===== PLANS ENDPOINTS =====

// Get all plans
app.get("/make-server-5522dc1e/plans", async (c) => {
  try {
    const plans = await kv.getByPrefix("plan:");
    return c.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return c.json({ error: "Failed to fetch plans" }, 500);
  }
});

// Create plan
app.post("/make-server-5522dc1e/plans", async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const plan = {
      id,
      ...body,
    };
    
    await kv.set(`plan:${id}`, plan);
    return c.json({ plan }, 201);
  } catch (error) {
    console.error("Error creating plan:", error);
    return c.json({ error: "Failed to create plan" }, 500);
  }
});

// Update plan
app.put("/make-server-5522dc1e/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingPlan = await kv.get(`plan:${id}`);
    if (!existingPlan) {
      return c.json({ error: "Plan not found" }, 404);
    }
    
    const updatedPlan = {
      ...existingPlan,
      ...body,
      id,
    };
    
    await kv.set(`plan:${id}`, updatedPlan);
    return c.json({ plan: updatedPlan });
  } catch (error) {
    console.error("Error updating plan:", error);
    return c.json({ error: "Failed to update plan" }, 500);
  }
});

// Delete plan
app.delete("/make-server-5522dc1e/plans/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const existingPlan = await kv.get(`plan:${id}`);
    if (!existingPlan) {
      return c.json({ error: "Plan not found" }, 404);
    }
    
    await kv.del(`plan:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return c.json({ error: "Failed to delete plan" }, 500);
  }
});

// ===== INVOICES ENDPOINTS =====

// Get all invoices
app.get("/make-server-5522dc1e/invoices", async (c) => {
  try {
    const invoices = await kv.getByPrefix("invoice:");
    return c.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return c.json({ error: "Failed to fetch invoices" }, 500);
  }
});

// Get invoices by client ID
app.get("/make-server-5522dc1e/invoices/client/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    const allInvoices = await kv.getByPrefix("invoice:");
    const clientInvoices = allInvoices.filter((inv: any) => inv.clientId === clientId);
    return c.json({ invoices: clientInvoices });
  } catch (error) {
    console.error("Error fetching client invoices:", error);
    return c.json({ error: "Failed to fetch client invoices" }, 500);
  }
});

// Create invoice
app.post("/make-server-5522dc1e/invoices", async (c) => {
  try {
    const body = await c.req.json();
    const id = `INV-${Date.now()}`;
    const invoice = {
      id,
      ...body,
      date: new Date().toISOString(),
    };
    
    await kv.set(`invoice:${id}`, invoice);
    return c.json({ invoice }, 201);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return c.json({ error: "Failed to create invoice" }, 500);
  }
});

// Update invoice
app.put("/make-server-5522dc1e/invoices/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    
    const existingInvoice = await kv.get(`invoice:${id}`);
    if (!existingInvoice) {
      return c.json({ error: "Invoice not found" }, 404);
    }
    
    const updatedInvoice = {
      ...existingInvoice,
      ...body,
      id,
    };
    
    await kv.set(`invoice:${id}`, updatedInvoice);
    return c.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return c.json({ error: "Failed to update invoice" }, 500);
  }
});

// Initialize sample data if needed
app.post("/make-server-5522dc1e/init-data", async (c) => {
  try {
    // Check if data already exists
    const existingClients = await kv.getByPrefix("client:");
    if (existingClients.length > 0) {
      return c.json({ message: "Data already initialized" });
    }

    // Initialize sample data from mockData
    const sampleClients = [
      {
        id: '1',
        name: 'Juan Pérez',
        ipAddress: '192.168.1.100',
        poleNumber: 'P-1234',
        neighborhood: 'Centro',
        planName: '100 Mbps + TV',
        status: 'active',
        email: 'juan.perez@email.com',
        phone: '+1 555-0123',
        address: 'Calle Principal 123, Centro',
        connectionStatus: 'online',
        monthlyFee: 49.99,
        joinDate: '2023-01-15',
      },
      {
        id: '2',
        name: 'María González',
        ipAddress: '192.168.1.101',
        poleNumber: 'P-1235',
        neighborhood: 'Norte',
        planName: '50 Mbps',
        status: 'delinquent',
        email: 'maria.gonzalez@email.com',
        phone: '+1 555-0124',
        address: 'Avenida Norte 456, Norte',
        connectionStatus: 'offline',
        monthlyFee: 29.99,
        joinDate: '2023-03-20',
      },
    ];

    for (const client of sampleClients) {
      await kv.set(`client:${client.id}`, client);
    }

    const samplePlans = [
      {
        id: '1',
        name: '50 Mbps',
        price: 29.99,
        features: ['50 Mbps de descarga', '10 Mbps de subida', 'Soporte 24/7'],
      },
      {
        id: '2',
        name: '100 Mbps + TV',
        price: 49.99,
        features: ['100 Mbps de descarga', '20 Mbps de subida', 'TV Estándar (120+ canales)', 'Soporte 24/7'],
      },
    ];

    for (const plan of samplePlans) {
      await kv.set(`plan:${plan.id}`, plan);
    }

    return c.json({ message: "Sample data initialized successfully" });
  } catch (error) {
    console.error("Error initializing data:", error);
    return c.json({ error: "Failed to initialize data" }, 500);
  }
});

Deno.serve(app.fetch);