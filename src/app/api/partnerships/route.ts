import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DATA_FILE = path.join(process.cwd(), "src/data/partnerships.json");

// Ensure the directory and file exist
function getPartnershipsData() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialData = [
      {
        id: "p1",
        companyName: "Mahindra Electric",
        contactPerson: "Ramesh Kumar",
        emailId: "ramesh.k@mahindra.com",
        address: "Electronic City, Bangalore, Karnataka",
        category: "EV OEM",
        lastInteractionDate: "2026-07-10",
        currentStatus: "Negotiation",
        nextFollowUpDate: "2026-07-20",
        nextAction: "Finalize SLA for battery supply partnership",
        expectedOutcome: "Long term battery pack procurement at 12% discount",
        history: [
          { date: "2026-07-10", note: "Status updated to Negotiation. Reviewed draft SLA." },
          { date: "2026-07-05", note: "Initial call done. Share technical requirements sheet." }
        ]
      },
      {
        id: "p2",
        companyName: "BluSmart Mobility",
        contactPerson: "Aniket Shah",
        emailId: "aniket@blusmart.in",
        address: "Gurugram, Haryana",
        category: "EV Fleet",
        lastInteractionDate: "2026-07-15",
        currentStatus: "Partnership Confirmed",
        nextFollowUpDate: "2026-07-25",
        nextAction: "Onboard first batch of 50 drivers on InnoVibe platform",
        expectedOutcome: "Increase booking volume by 35% in Delhi NCR",
        history: [
          { date: "2026-07-15", note: "Partnership confirmed and agreement signed." },
          { date: "2026-07-10", note: "Agreement finalized. Final sign-off scheduled." }
        ]
      },
      {
        id: "p3",
        companyName: "GoMechanic EV",
        contactPerson: "Vikram Malhotra",
        emailId: "vikram@gomechanic.in",
        address: "Pune, Maharashtra",
        category: "EV Garage",
        lastInteractionDate: "2026-07-02",
        currentStatus: "Discussion Ongoing",
        nextFollowUpDate: "2026-07-16",
        nextAction: "Conduct audit of their service bays for EV compatibility",
        expectedOutcome: "Standardize service SLA for out-of-warranty repairs",
        history: [
          { date: "2026-07-02", note: "Discussion ongoing. Shared initial pricing structure." }
        ]
      },
      {
        id: "p4",
        companyName: "Sequoia India",
        contactPerson: "Sandip Singh",
        emailId: "sandip@sequoia.com",
        address: "Bandra Kurla Complex, Mumbai",
        category: "EV Funding",
        lastInteractionDate: "2026-06-25",
        currentStatus: "Closed Won",
        nextFollowUpDate: "2026-08-01",
        nextAction: "Submit Q2 operational telemetry report",
        expectedOutcome: "Unlock Series B funding second tranche of $4.5M",
        history: [
          { date: "2026-06-25", note: "Investment round closed won. Term sheet completed." }
        ]
      },
      {
        id: "p5",
        companyName: "Ola Experience Centre",
        contactPerson: "Pooja Reddy",
        emailId: "pooja.r@olacabs.com",
        address: "Koramangala, Bangalore",
        category: "EV Dealership",
        lastInteractionDate: "2026-07-16",
        currentStatus: "New",
        nextFollowUpDate: "2026-07-18",
        nextAction: "Send partnership intro deck and proposal",
        expectedOutcome: "Set up joint referral booths at Ola experience zones",
        history: [
          { date: "2026-07-16", note: "Inbound interest received. Contact person identified." }
        ]
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function savePartnershipsData(data: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function GET() {
  try {
    const data = getPartnershipsData();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      emailId,
      address,
      category,
      lastInteractionDate,
      currentStatus,
      nextFollowUpDate,
      nextAction,
      expectedOutcome,
      note // Optional interaction note added during create/update
    } = body;

    if (!companyName || !contactPerson || !emailId || !category || !currentStatus) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields (Company Name, Contact Person, Email ID, Category, Status)" },
        { status: 400 }
      );
    }

    const data = getPartnershipsData();

    const newRecord = {
      id: "part_" + Date.now(),
      companyName,
      contactPerson,
      emailId,
      address: address || "",
      category,
      lastInteractionDate: lastInteractionDate || new Date().toISOString().split("T")[0],
      currentStatus,
      nextFollowUpDate: nextFollowUpDate || "",
      nextAction: nextAction || "",
      expectedOutcome: expectedOutcome || "",
      history: [
        {
          date: new Date().toISOString().split("T")[0],
          note: note || `Partnership record created with status: ${currentStatus}`
        }
      ]
    };

    data.push(newRecord);
    savePartnershipsData(data);

    return NextResponse.json({ ok: true, message: "Partnership created successfully.", data: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      companyName,
      contactPerson,
      emailId,
      address,
      category,
      lastInteractionDate,
      currentStatus,
      nextFollowUpDate,
      nextAction,
      expectedOutcome,
      note // Optional history interaction note
    } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing partnership ID" }, { status: 400 });
    }

    const data = getPartnershipsData();
    const index = data.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ ok: false, error: "Partnership not found" }, { status: 404 });
    }

    const current = data[index];
    const prevStatus = current.currentStatus;

    // Check if status has changed
    const statusChanged = currentStatus && currentStatus !== prevStatus;
    const historyEntryNote = note 
      ? note 
      : statusChanged 
        ? `Status updated from ${prevStatus} to ${currentStatus}` 
        : "Partnership record updated";

    const updatedRecord = {
      ...current,
      companyName: companyName !== undefined ? companyName : current.companyName,
      contactPerson: contactPerson !== undefined ? contactPerson : current.contactPerson,
      emailId: emailId !== undefined ? emailId : current.emailId,
      address: address !== undefined ? address : current.address,
      category: category !== undefined ? category : current.category,
      lastInteractionDate: lastInteractionDate !== undefined ? lastInteractionDate : current.lastInteractionDate,
      currentStatus: currentStatus !== undefined ? currentStatus : current.currentStatus,
      nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : current.nextFollowUpDate,
      nextAction: nextAction !== undefined ? nextAction : current.nextAction,
      expectedOutcome: expectedOutcome !== undefined ? expectedOutcome : current.expectedOutcome,
      history: [
        ...(current.history || []),
        {
          date: new Date().toISOString().split("T")[0],
          note: historyEntryNote
        }
      ]
    };

    data[index] = updatedRecord;
    savePartnershipsData(data);

    return NextResponse.json({ ok: true, message: "Partnership updated successfully.", data: updatedRecord }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing partnership ID" }, { status: 400 });
    }

    const data = getPartnershipsData();
    const filtered = data.filter((p: any) => p.id !== id);

    if (filtered.length === data.length) {
      return NextResponse.json({ ok: false, error: "Partnership not found" }, { status: 404 });
    }

    savePartnershipsData(filtered);
    return NextResponse.json({ ok: true, message: "Partnership deleted successfully." }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
