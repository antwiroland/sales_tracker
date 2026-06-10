import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Invoice, User } from "@/models";
import { ok, route, requireUser, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { uploadImage } from "@/lib/cloudinary";
import { INVOICE_STATUS, ROLES, AUDIT_ACTIONS } from "@/lib/constants";

const createSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerName: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  notes: z.string().optional(),
  invoiceDate: z.string(), // ISO date
  kpiId: z.string().optional().nullable(),
  status: z.enum([INVOICE_STATUS.DRAFT, INVOICE_STATUS.SUBMITTED]).optional(),
  imageDataUri: z.string().optional(), // base64 data URI to upload
  image: z
    .object({ publicId: z.string(), url: z.string() })
    .optional(), // pre-uploaded
});

export const GET = route(async (req: Request) => {
  const user = await requireUser();
  await connectDB();
  const { searchParams } = new URL(req.url);

  const filter: Record<string, unknown> = {};
  if (searchParams.get("status")) filter.status = searchParams.get("status");
  if (searchParams.get("month")) filter.month = Number(searchParams.get("month"));
  if (searchParams.get("year")) filter.year = Number(searchParams.get("year"));

  // Scope by role: sales see their own; supervisors see their queue; others see all.
  if (user.role === ROLES.SALES) {
    filter.employeeId = user.id;
  } else if (user.role === ROLES.SUPERVISOR) {
    filter.supervisorId = user.id;
  } else if (searchParams.get("employeeId")) {
    filter.employeeId = searchParams.get("employeeId");
  }

  const invoices = await Invoice.find(filter)
    .populate("employeeId", "firstName lastName")
    .populate("supervisorId", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(Number(searchParams.get("limit") ?? 200))
    .lean();

  return ok({ invoices });
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  if (user.role !== ROLES.SALES)
    throw new ApiError(403, "Only sales personnel can submit invoices");

  await connectDB();
  const body = createSchema.parse(await req.json());

  const invoiceDate = new Date(body.invoiceDate);
  if (Number.isNaN(invoiceDate.getTime())) throw new ApiError(422, "Invalid invoice date");

  const me = await User.findById(user.id).select("supervisorId branchId").lean();

  let image = body.image;
  if (!image && body.imageDataUri) {
    const uploaded = await uploadImage(body.imageDataUri, "invoices");
    if (uploaded) image = uploaded;
  }

  const status = body.status ?? INVOICE_STATUS.SUBMITTED;

  const invoice = await Invoice.create({
    invoiceNumber: body.invoiceNumber,
    employeeId: user.id,
    branchId: me?.branchId,
    supervisorId: me?.supervisorId,
    kpiId: body.kpiId || undefined,
    customerName: body.customerName,
    amount: body.amount,
    description: body.description ?? "",
    notes: body.notes ?? "",
    invoiceDate,
    image: image ?? {},
    status,
    month: invoiceDate.getMonth() + 1,
    year: invoiceDate.getFullYear(),
  });

  if (status === INVOICE_STATUS.SUBMITTED) {
    await audit({
      actorId: user.id,
      actorName: user.name ?? "",
      action: AUDIT_ACTIONS.INVOICE_SUBMITTED,
      entity: "Invoice",
      entityId: String(invoice._id),
      meta: { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount },
    });
  }

  return ok({ invoice }, { status: 201 });
});
