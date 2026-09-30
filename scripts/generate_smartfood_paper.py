from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, NextPageTemplate, KeepTogether, Flowable, Image as RLImage
)
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "SmartFoodRescue_IEEE_Research_Paper.pdf"
SCREENSHOTS = ROOT / "assets" / "paper_screenshots"
OUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
MARGIN_X = 16 * mm
BOTTOM = 15 * mm
TOP = 14 * mm
GUTTER = 6 * mm
COL_W = (PAGE_W - 2 * MARGIN_X - GUTTER) / 2

styles = getSampleStyleSheet()
body = ParagraphStyle(
    "IEEEBody", parent=styles["BodyText"], fontName="Times-Roman",
    fontSize=10, leading=12, alignment=TA_JUSTIFY,
    spaceAfter=3, firstLineIndent=4.5 * mm,
)
body_noindent = ParagraphStyle(
    "IEEEBodyNoIndent", parent=body, firstLineIndent=0,
)
abstract = ParagraphStyle(
    "Abstract", parent=body_noindent, fontSize=9, leading=10.5,
)
section = ParagraphStyle(
    "Section", parent=styles["Heading2"], fontName="Times-Bold",
    fontSize=10, leading=12, alignment=TA_CENTER, spaceBefore=6, spaceAfter=4,
)
subsection = ParagraphStyle(
    "Subsection", parent=styles["Heading3"], fontName="Times-BoldItalic",
    fontSize=9, leading=11, spaceBefore=4, spaceAfter=3,
)
caption = ParagraphStyle(
    "Caption", parent=body_noindent, fontSize=8, leading=9.5,
    alignment=TA_CENTER, spaceBefore=2, spaceAfter=4,
)
refstyle = ParagraphStyle(
    "References", parent=body_noindent, fontSize=8, leading=9.4,
    leftIndent=4.5 * mm, firstLineIndent=-4.5 * mm, spaceAfter=2.5,
)
small = ParagraphStyle(
    "Small", parent=body_noindent, fontSize=8.2, leading=9.6,
)


def first_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Times-Bold", 18)
    title = "SmartFoodRescue: A Secure Full-Stack Platform for"
    title2 = "Traceable Surplus-Food Redistribution and Live Delivery Tracking"
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 24 * mm, title)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 31 * mm, title2)
    authors = [
        (PAGE_W / 6, 43, "", "", "Department of CSE (AI&amp;ML)", "Vishwakarma Institute of Technology", "Pune, India."),
        (PAGE_W / 2, 43, "2nd Divya Ambre", "divya.12620285@vit.edu", "Department Of CSE(AIML)", "Vishwkarma Institute Of Technology", "Pune India"),
        (5 * PAGE_W / 6, 43, "3rd Sumit Ghogare", "sumit.1262030105@vit.edu", "Department Of CSE(AIML)", "Vishwkarma Institute Of Technology", "Pune India"),
        (PAGE_W / 3, 69, "4th Tanvi Patil", "tanvi.12620640@vit.edu", "Department Of CSE(AIML)", "Vishwkarma Institute Of Technology", "Pune India"),
        (2 * PAGE_W / 3, 69, "5th Tanvi Shrirame", "tanavi.12620523@vit.edu", "Department Of CSE(AIML)", "Vishwkarma Institute Of Technology", "Pune India"),
    ]
    for x, top_mm, name, email, department, institute, location in authors:
        canvas.setFillColor(colors.black)
        canvas.setFont("Times-Roman", 9.2)
        if name:
            canvas.drawCentredString(x, PAGE_H - top_mm * mm, name)
        canvas.setFont("Times-Roman", 7.9)
        canvas.drawCentredString(x, PAGE_H - (top_mm + 5) * mm, department.replace("&amp;", "&"))
        canvas.drawCentredString(x, PAGE_H - (top_mm + 10) * mm, institute)
        canvas.drawCentredString(x, PAGE_H - (top_mm + 15) * mm, location)
        if email:
            canvas.setFillColor(colors.HexColor("#1155cc"))
            canvas.drawCentredString(x, PAGE_H - (top_mm + 20) * mm, email)
    canvas.setFillColor(colors.black)
    canvas.restoreState()


def later_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Times-Roman", 7)
    canvas.setFillColor(colors.HexColor("#555555"))
    canvas.drawCentredString(PAGE_W / 2, 8 * mm, str(doc.page))
    canvas.restoreState()


first_frames = [
    Frame(MARGIN_X, BOTTOM, COL_W, PAGE_H - BOTTOM - 96 * mm, id="first-left", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
    Frame(MARGIN_X + COL_W + GUTTER, BOTTOM, COL_W, PAGE_H - BOTTOM - 96 * mm, id="first-right", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
]
def make_later_frames(suffix):
    return [
        Frame(MARGIN_X, BOTTOM, COL_W, PAGE_H - BOTTOM - TOP, id=f"left-{suffix}", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
        Frame(MARGIN_X + COL_W + GUTTER, BOTTOM, COL_W, PAGE_H - BOTTOM - TOP, id=f"right-{suffix}", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0),
    ]

doc = BaseDocTemplate(
    str(OUT), pagesize=A4, leftMargin=MARGIN_X, rightMargin=MARGIN_X,
    topMargin=TOP, bottomMargin=BOTTOM, title="SmartFoodRescue IEEE Research Paper",
    author="Divya Ambre; Sumit Ghogare; Tanvi Patil; Tanvi Shrirame", subject="Secure food rescue and redistribution platform",
)
doc.addPageTemplates([
    PageTemplate(id="First", frames=first_frames, onPage=first_page),
    PageTemplate(id="Later1", frames=make_later_frames("1"), onPage=later_page),
])


def P(text, style=body):
    return Paragraph(text, style)


def heading(number, text):
    return P(f"{number}.&nbsp;&nbsp;{text.upper()}", section)


def subheading(letter, text):
    return P(f"{letter}.&nbsp;&nbsp;{text}", subsection)


def screenshot_figure(filename, caption_text, width=COL_W):
    path = SCREENSHOTS / filename
    if not path.exists():
        raise FileNotFoundError(path)
    from PIL import Image as PILImage
    with PILImage.open(path) as source:
        aspect = source.height / source.width
    figure = RLImage(str(path), width=width, height=width * aspect)
    figure.hAlign = "CENTER"
    block = Table([[figure], [P(caption_text, caption)]], colWidths=[width], splitByRow=1)
    block.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("NOSPLIT", (0, 0), (-1, -1)),
    ]))
    return block


class WideFigurePage:
    """Marker consumed by the page composer as a full-width figure page."""
    def __init__(self, figures):
        self.figures = figures


def wide_figure_page(*figures):
    return WideFigurePage(figures)


def draw_wide_figure_page(canvas, plate):
    width = PAGE_W - 2 * MARGIN_X
    bottom = BOTTOM + 4 * mm
    y = PAGE_H - TOP - 4 * mm
    gap = 8 * mm
    for index, (filename, caption_text) in enumerate(plate.figures):
        path = SCREENSHOTS / filename
        if not path.exists():
            raise FileNotFoundError(path)
        from PIL import Image as PILImage
        with PILImage.open(path) as source:
            aspect = source.height / source.width
        caption_flowable = P(caption_text, caption)
        _, caption_height = caption_flowable.wrap(width, PAGE_H)
        remaining = len(plate.figures) - index
        max_image_height = (y - bottom - (remaining - 1) * gap - remaining * (caption_height + 3 * mm)) / remaining
        image_height = min(width * aspect, max_image_height)
        image_width = image_height / aspect
        x = (PAGE_W - image_width) / 2
        canvas.drawImage(str(path), x, y - image_height, width=image_width, height=image_height,
                         preserveAspectRatio=True, anchor="c", mask="auto")
        y -= image_height + 2 * mm
        caption_flowable.drawOn(canvas, MARGIN_X, y - caption_height)
        y -= caption_height + (gap if remaining > 1 else 0)


def arrow(d, x1, y1, x2, y2, color=colors.black):
    d.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=0.8))
    ang = 3
    if x2 >= x1:
        d.add(Polygon([x2, y2, x2-ang, y2+2, x2-ang, y2-2], fillColor=color, strokeColor=color))
    else:
        d.add(Polygon([x2, y2, x2+ang, y2+2, x2+ang, y2-2], fillColor=color, strokeColor=color))


def architecture_diagram():
    d = Drawing(COL_W, 132)
    green = colors.HexColor("#dff3e4")
    blue = colors.HexColor("#e7f0fb")
    amber = colors.HexColor("#fff2cc")
    gray = colors.HexColor("#f1f1f1")
    boxes = [
        (2, 94, 49, 25, "Donor"), (57, 94, 49, 25, "NGO"),
        (112, 94, 49, 25, "Volunteer"), (167, 94, 49, 25, "Admin"),
    ]
    for x, y, w, h, label in boxes:
        d.add(Rect(x, y, w, h, fillColor=green, strokeColor=colors.black, rx=3, ry=3))
        d.add(String(x+w/2, y+9, label, textAnchor="middle", fontName="Times-Bold", fontSize=8))
    d.add(Rect(14, 53, 194, 28, fillColor=blue, strokeColor=colors.black, rx=3, ry=3))
    d.add(String(111, 69, "React + TypeScript Client", textAnchor="middle", fontName="Times-Bold", fontSize=8.5))
    d.add(String(111, 58, "REST API + Socket.IO client + Geolocation", textAnchor="middle", fontSize=7.3))
    d.add(Rect(14, 13, 158, 28, fillColor=amber, strokeColor=colors.black, rx=3, ry=3))
    d.add(String(93, 29, "Node.js + Express + Socket.IO", textAnchor="middle", fontName="Times-Bold", fontSize=8.2))
    d.add(String(93, 18, "JWT/RBAC, workflow, OAuth email, routing", textAnchor="middle", fontSize=6.9))
    for x in [26, 81, 136, 191]:
        arrow(d, x, 94, 111, 81)
    arrow(d, 111, 53, 111, 41)
    d.add(Rect(181, 13, 41, 28, fillColor=gray, strokeColor=colors.black, rx=3, ry=3))
    d.add(String(201.5, 29, "Atlas", textAnchor="middle", fontName="Times-Bold", fontSize=7.6))
    d.add(String(201.5, 19, "MongoDB", textAnchor="middle", fontSize=7))
    arrow(d, 172, 27, 181, 27)
    return d


def lifecycle_diagram():
    d = Drawing(COL_W, 98)
    top = [(3, 67, "ASSIGNED"), (58, 67, "RECEIVED"), (113, 67, "DISPATCHED"), (168, 67, "EN_ROUTE")]
    bottom = [(58, 32, "DISTRIBUTED"), (113, 32, "DELIVERED"), (168, 32, "ARRIVED")]
    for i, (x, y, lab) in enumerate(top):
        fill = colors.HexColor("#e7f0fb") if i < 3 else colors.HexColor("#dff3e4")
        d.add(Rect(x, y, 49, 20, fillColor=fill, strokeColor=colors.black, rx=2, ry=2))
        d.add(String(x+24.5, y+7.5, lab, textAnchor="middle", fontName="Times-Bold", fontSize=6.6))
        if i < 3:
            arrow(d, x+49, y+10, x+55, y+10)
    arrow(d, 192.5, 67, 192.5, 52)
    for x, y, lab in bottom:
        d.add(Rect(x, y, 49, 20, fillColor=colors.HexColor("#dff3e4"), strokeColor=colors.black, rx=2, ry=2))
        d.add(String(x+24.5, y+7.5, lab, textAnchor="middle", fontName="Times-Bold", fontSize=6.6))
    arrow(d, 168, 42, 162, 42)
    arrow(d, 113, 42, 107, 42)
    d.add(String(COL_W/2, 13, "Each transition is role-checked and appended to the pickup audit trail.",
                 textAnchor="middle", fontName="Times-Italic", fontSize=7.2))
    return d


story = []
story.append(P("<b><i>Abstract-</i></b> Posting surplus food is the easy part of food rescue; arranging a safe, timely handover is much harder. <i>SmartFoodRescue</i> was built around that second problem. The application gives donors, NGOs, volunteers, and administrators one place to manage a donation after it is offered. React and TypeScript provide the browser interface, while Node.js, Express, and MongoDB Atlas support the service and its records. We represent every pickup through seven meaningful stages: ASSIGNED, RECEIVED, DISPATCHED, EN_ROUTE, ARRIVED, DELIVERED, and DISTRIBUTED. When travel starts, the volunteer's phone shares real GPS observations through the browser Geolocation API. The server verifies the volunteer and coordinate payload before Socket.IO sends an update to the private room for that pickup. Donors, NGO staff, and administrators who belong to the workflow can follow the position, accuracy, speed, heading, connection state, and latest update on the map. Gmail API OAuth 2.0 handles progress messages and password-recovery mail. Recovery tokens expire quickly, are stored only as SHA-256 digests, and are deleted after use. Both production builds completed successfully, and we traced the code responsible for authorization, workflow changes, navigation, notifications, and tracking. The result is a continuous digital record from the first donor entry to the NGO's distribution confirmation.", abstract))
story.append(P("<b><i>Keywords-</i></b> food rescue; surplus-food redistribution; real-time GPS tracking; Socket.IO; MERN; role-based access control; logistics traceability.", abstract))

story.append(heading("I", "Introduction"))
story.append(P("Edible surplus has a short useful life. By the time people exchange phone calls, confirm an address, and find a driver, the food may already be unsuitable for collection. An online listing helps, but it does not answer what happens after someone clicks Accept. Research describes food-recovery platforms as links between supply and demand [1], [2], and field evidence shows how weak coordination can undermine the actual pickup [3]. We therefore designed the delivery process as part of the main system rather than leaving it to messages outside the application."))
story.append(P("Previous work approaches the problem from different angles. Some platforms help people discover food; allocation studies decide which organization should receive it; volunteer research examines how collection tasks are announced [4], [5]. SmartFoodRescue begins where those activities meet: an NGO has accepted a real donation and somebody must now move it responsibly."))
story.append(P("Role dashboards, authentication, mapping, and real-time coordination already appear in MERN food-donation systems [6]. Our design connects them through a server-enforced pickup sequence. Each status change is recorded, each location message belongs to one authorized room, and the notification service uses OAuth instead of an embedded mailbox password. Password-reset secrets are stored as hashes, and the API returns role-appropriate data rather than complete user records."))
story.append(P("This produces a practical architecture that can be deployed with widely available services. More importantly, it prevents the live map from becoming a separate feature with no lasting evidence: the journey stays tied to the donation, its authorized participants, and the final distribution record."))
story.append(subheading("A", "Study Scope and Method"))
story.append(P("This paper documents a software system and the engineering choices visible in its implementation. It is not a controlled study of food-waste reduction, travel efficiency, or community impact. We reviewed the client and server structure, followed the pickup lifecycle through its API and socket handlers, examined the persistence and notification paths, and confirmed that the production builds completed. The supplied interface captures are used to show the four roles and the tracking and messaging screens. This method supports a descriptive account of what the project implements; it does not establish how well the system performs in a live rescue operation."))
story.append(P("The unit of analysis is a donation after an NGO chooses to accept it. That boundary matters because a listing alone can be counted even when nobody collects the food. We therefore follow each record from donor submission through NGO acceptance, volunteer assignment, handover, travel, arrival, delivery, and distribution. We also distinguish application events from real-world events: a status can record that a participant reported a handover, but it cannot independently prove food condition, quantity, or beneficiary receipt."))
story.append(P("The design is guided by three practical questions. First, can each participant see enough information to perform their part without receiving broad access to unrelated records? Second, can a delayed or invalid client request move a pickup into an impossible state? Third, can a viewer tell whether the volunteer's position is current and authorized? These questions focus the implementation on access boundaries, state transitions, and the meaning of live data. They also provide a basis for a later field evaluation without claiming that one has already taken place."))
story.append(subheading("B", "Problem Definition and Design Goals"))
story.append(P("A rescue workflow joins two different kinds of coordination. The first is a matching decision: an NGO decides whether the type, quantity, location, and remaining usable time fit its needs. The second is a physical movement task: a volunteer must collect the item and deliver it to an agreed destination. A system that models only the first can leave the most time-sensitive part to informal calls. A system that models only vehicle movement can lose the link to the donation and its final disposition. SmartFoodRescue keeps both activities under one pickup record."))
story.append(P("We used four design goals to make this boundary concrete: preserve a clear audit trail, limit information to participants in a pickup, keep location updates responsive while avoiding unnecessary history reads, and make failed or incomplete operations visible. These goals lead to different mechanisms. A state transition records a durable event; a Socket.IO room carries short-lived coordinates; the latest-position record supports a quick map refresh; and optional breadcrumbs support later review where the organization has a justified retention policy. The mechanisms are related, but none is a substitute for the others."))

story.append(heading("II", "Related Work"))
story.append(P("Ciulli <i>et al.</i> use the term circularity broker for a platform that links supply-side and demand-side participants while remaining part of the surrounding recovery process [1]. Principato <i>et al.</i> examine a multi-sided surplus marketplace and show why technical growth must be considered together with social, environmental, and economic aims [2]. Aloysius and Ananda reach a related conclusion from a Sri Lankan case: collection suffers when logistics and coordination remain loosely organized [3]. We used these studies to define the platform boundary, particularly the need to represent acceptance and physical pickup explicitly."))
story.append(P("Other research focuses on operational decisions. Mertzanidis <i>et al.</i> study real-time allocation of rejected food loads while considering both fairness and driver efficiency [4]. Manshadi and Rodilitz evaluate online policies for notifying volunteers with Food Rescue U.S. data [5]. SmartFoodRescue does not yet optimize either decision. It first establishes the authenticated workflow and historical data that such algorithms would need."))
story.append(P("Application-oriented work includes a MERN food-donation system with roles, geographic information, and real-time coordination [6], a mobile distribution application with pickup scheduling and geolocation [7], and the AI-FEED prototype for the charity ecosystem [8]. Our design differs in where it places persistence. The pickup is its own auditable object, with a permitted state path, authorized socket membership, a latest coordinate, optional breadcrumbs, routing results, and notification events."))
story.append(P("Taken together, this literature points to a gap between discovering a surplus listing and confirming a completed transfer. Allocation research asks which request should be served, while volunteer-policy research asks when and how a task should be offered. Those are important decisions, but both assume that a task can be represented reliably once somebody accepts it. The records needed to study those decisions are weak if acceptance, courier assignment, failed collection, and final distribution are collapsed into one status."))
story.append(P("Our contribution is consequently an integration and traceability design rather than a new allocation algorithm. The platform links role-scoped dashboards to a persisted pickup lifecycle and a live location channel. The location stream is authorized against the same pickup relationships that govern the workflow, and the final distribution event remains separate from delivery to the NGO. This gives future allocation or notification work a more useful operational history while keeping the limits of the current implementation explicit."))

story.append(heading("III", "System Requirements and Architecture"))
story.append(P("We separated the interface and permissions around four actors. Donors enter the item, category, amount, expiry information, and pickup address. NGOs browse unclaimed records and choose donations they can handle. A volunteer receives a specific pickup rather than unrestricted access to donor activity. Administrators can inspect the wider operation and manage accounts. REST carries ordinary stored-data requests, whereas Socket.IO is used only for time-sensitive tracking events."))
story.append(subheading("A", "Actors and Requirements"))
story.append(P("The donor's main task is to describe the food accurately enough for an NGO to make a decision. A useful listing needs an item name, food category, quantity and unit, expiry or usable-until information, and a pickup location. Missing or ambiguous fields increase the number of follow-up calls and can waste the time available for collection. The donor also needs a visible record of requests and pickup progress, so that the listing does not disappear into an unseen queue."))
story.append(P("The NGO has a different view of the same record. It needs to compare available food with its capacity, accept or decline a request, track expected arrivals, and record distribution after receipt. The volunteer needs only the pickup assigned to them, the two locations, contact details needed for the handover, and controls for advancing the trip. Administrative access supports platform operation and review. These separate tasks explain why a shared database does not imply a shared unrestricted interface."))
story.append(P("Several requirements follow from the short shelf life of donated food. The interface should make expiry information prominent; the workflow should identify who currently has custody; the map should indicate whether its position is recent; and a completed delivery should remain distinguishable from downstream distribution. When location permission is unavailable or connectivity is interrupted, the application should communicate that condition instead of presenting an old marker as if it were current. These are operational requirements as much as software features."))
story.append(architecture_diagram())
story.append(P("Fig. 1. SmartFoodRescue logical architecture.", caption))
story.append(P("We store accounts, donations, pickups, distributions, and tracking information in MongoDB. The location used by the live map is kept in one small current-position record so that viewers do not load an entire journey on every update. Route points may also be written to a separate history collection when replay is required. For deployment, the client is suitable for Vercel, the API for Render, and the database for MongoDB Atlas. Google Routes can provide road geometry and ETA, while OSRM keeps navigation available when the commercial service is not configured. Environment variables hold database, JWT, OAuth, origin, and routing credentials outside the browser bundle."))
story.append(subheading("B", "Component Boundaries and Request Flow"))
story.append(P("The browser client is responsible for presenting role-specific work, collecting form values, requesting device location, and showing the status returned by the service. It is not the authority for ownership or permission. A donor may edit a donation while it is still eligible for editing, but the server must confirm that the authenticated account owns the record. An NGO request must be tied to an available donation. A volunteer update must match the volunteer assigned to the pickup. This arrangement allows the same API to protect actions from both the normal interface and a manually constructed request."))
story.append(P("The API separates durable operations from the live channel. A form submission or status transition uses a request-response operation so that validation errors can be returned with a clear result. A location update is frequent and short-lived, so it travels as an event after authentication. The server is the bridge between these paths: it verifies the event, stores the latest point, and emits the authorized update. A viewer can then receive a current value from persistence and subsequent changes from the socket. This read-then-subscribe pattern avoids treating a connection as a complete history."))
story.append(P("The deployment environment also forms part of the boundary. The frontend receives public configuration such as the API origin, while database credentials, token-signing secrets, OAuth refresh credentials, and routing-service keys stay on the backend. Cross-origin rules should name the deployed client rather than allow arbitrary origins. The database connection should be restricted to the backend service, and production logs should avoid writing reset links, access tokens, or unnecessary location history. These settings are operational controls; they need to be checked again when preview and production environments are configured."))
story.append(P("This division helps make failures understandable. If the API cannot reach Atlas, a donation should not be reported as saved. If email is unavailable, a valid database transition should remain recorded while the notification attempt is retried or surfaced. If the socket disconnects, the durable pickup record remains available and the interface can display the time of its last position. By assigning each responsibility to a clear component, the team can diagnose these failures without confusing a screen update with a committed record."))
story.append(wide_figure_page(
    ("donor_dashboard.png", "Fig. 2. Donor dashboard with donation history, NGO requests, and pickup status."),
    ("ngo_dashboard.png", "Fig. 3. NGO dashboard for browsing surplus food and managing incoming pickups."),
))
story.append(P("The two dashboard views illustrate why role context is part of the data model. A donor follows offers and incoming requests; an NGO browses food and manages the requests it has made. The same donation may therefore appear with different available actions, while its underlying identity and status remain consistent. In a production deployment, the server remains responsible for deciding whether an action is valid; hiding a button in the interface is not an authorization boundary."))
story.append(P("At the service boundary, ordinary REST endpoints create and update durable records, while the socket channel handles frequent position events. This separation keeps a brief GPS update from being treated as a full donation edit. It also makes the flow easier to inspect: a database change should have a durable identifier and actor, while a location message should be checked against the pickup before reaching subscribers. The deployment plan uses Vercel for the client, Render for the API, and Atlas for hosted persistence, with secrets configured on the server."))

data = [
    [P("Layer", small), P("Technology", small), P("Responsibility", small)],
    [P("Client", small), P("React, TypeScript", small), P("Role dashboards, maps, device GPS", small)],
    [P("API", small), P("Node.js, Express", small), P("CRUD, validation, JWT/RBAC", small)],
    [P("Realtime", small), P("Socket.IO", small), P("Pickup rooms and location events", small)],
    [P("Persistence", small), P("MongoDB/Mongoose", small), P("Workflow, audit, tracking records", small)],
    [P("Messaging", small), P("Gmail API OAuth 2.0", small), P("Lifecycle and reset emails", small)],
]
t = Table(data, colWidths=[0.22*COL_W, 0.29*COL_W, 0.49*COL_W], repeatRows=1)
t.setStyle(TableStyle([
    ("GRID", (0,0), (-1,-1), 0.45, colors.black), ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e8e8e8")),
    ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 2),
    ("RIGHTPADDING", (0,0), (-1,-1), 2), ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
]))
story.append(P("TABLE I. IMPLEMENTATION STACK", caption))
story.append(t)

story.append(heading("IV", "Workflow and Data Model"))
story.append(P("The workflow begins when the donor form is saved. Acceptance by an NGO creates the context for a pickup and later volunteer assignment. We implemented the sequence in Fig. 4 as a server-side transition map, not merely as labels on the interface. An attempt to move straight from ASSIGNED to DELIVERED is therefore rejected even if a client sends that value manually. When a valid change is accepted, the service records the actor and time before returning the new state."))
story.append(subheading("A", "Donation and Pickup Records"))
story.append(P("The donation record describes what is being offered and where it can be collected. The pickup record describes the movement created after acceptance. Keeping these concepts separate helps preserve the original offer while allowing operational details to change, such as the assigned volunteer, destination, schedule, and current status. A distribution record then captures the final NGO activity. This structure avoids overloading a single document with fields that have different owners and lifetimes."))
story.append(P("A typical record relationship can be read as donor to donation, accepted request to pickup, pickup to assigned volunteer, and delivered pickup to distribution. Each link should be checked on the server before a user can read or change its data. The pickup identifier serves as the common key for status history and location updates, but knowing an identifier alone does not grant access. The authorization decision also depends on the authenticated user and their relationship to that pickup."))
story.append(P("Durable events and transient observations have different retention needs. A state transition is part of the accountability record and should preserve the actor, previous state, next state, and event time. A current GPS coordinate is useful for a live map but becomes less useful after delivery. A breadcrumb sequence can help investigate a disputed route, yet it also creates a detailed movement history. The system design therefore treats route history as optional and makes retention policy an operational decision rather than an automatic consequence of enabling the map."))
story.append(lifecycle_diagram())
story.append(P("Fig. 4. Enforced pickup lifecycle.", caption))
story.append(P("Each state corresponds to an observable handover event. At RECEIVED, the volunteer confirms the food and assumes custody at the donor's address. DISPATCHED indicates that the pickup is ready to leave. EN_ROUTE opens the live journey, and ARRIVED closes the GPS watcher at the destination. DELIVERED records the NGO handover; DISTRIBUTED is reserved for the later beneficiary record. Keeping these moments separate prevents a map status from being mistaken for proof that distribution occurred."))
story.append(P("A map reader usually needs only the newest point, so the current-location document contains latitude, longitude, accuracy, speed, heading, status, and time. Optional breadcrumb documents serve a different purpose: audit or route replay. This separation limits routine reads and makes it possible to apply a shorter retention rule to detailed movement history. Incoming coordinates must be numeric and within geographic bounds before they are stored or forwarded."))
story.append(wide_figure_page(
    ("volunteer_dashboard.png", "Fig. 5. Volunteer dashboard showing an assigned pickup and its tracking timeline."),
    ("live_tracking.png", "Fig. 6. Live rescue tracking view with map, courier, origin, and NGO destination details."),
))

story.append(heading("V", "Real-Time Tracking and Navigation"))
story.append(P("When a volunteer presses Start Navigation, the API first checks that the assigned pickup is DISPATCHED. Only then does it change the state to EN_ROUTE and allow the mobile page to start <font name='Courier'>watchPosition()</font>. Each callback is attached to the pickup and sent through the authenticated socket. Before a broadcast occurs, the server confirms the volunteer-pickup relationship and validates the coordinate payload."))
story.append(P("Socket rooms are protected by relationships, not by hard-to-guess identifiers. The room-join handler loads the pickup and admits the assigned volunteer, its donor, the NGO that accepted the donation, or an administrator. A different authenticated user remains outside the room. Because mobile connections are imperfect, the tracking page also shows accuracy, last-update time, stale-data state, and whether the socket has disconnected or recovered."))
story.append(P("The tracking screen places three locations in context: the donor origin, NGO destination, and moving volunteer. It supplements the marker with a road line, remaining distance, ETA, GPS accuracy, connection state, and timestamp. Google Routes is selected when configured; otherwise the server can request an OSRM route. At the destination, the Arrived action is accepted only from EN_ROUTE. The last point is retained, the status becomes ARRIVED, and the browser watcher is stopped."))
story.append(subheading("A", "Location Update Lifecycle"))
story.append(P("The tracking path has a clear start and stop. A volunteer first opens the assigned pickup and requests navigation. The server confirms that the pickup is in a state where travel may begin, associates the volunteer with the EN_ROUTE transition, and permits the client to start the browser watcher. Each observation includes latitude and longitude and may include accuracy, speed, and heading when the device supplies them. The time of observation is retained so a viewer can distinguish a new fix from a delayed message."))
story.append(P("Coordinates are not accepted simply because they are numeric. Latitude must be within -90 to 90 degrees and longitude within -180 to 180 degrees. Accuracy is useful context: a location with a large uncertainty radius should not be displayed as a precise point. A mobile device may also emit repeated or delayed observations, so clients should render the most recent valid update and show its age. The system records a last-update time, while an operational freshness threshold can be selected and tested for the expected network conditions."))
story.append(P("Socket.IO supports bidirectional, event-based communication, but the application still has to define what an event means and who may receive it. In this workflow, a location event is associated with one pickup room. On reconnection, the interface should recover the latest persisted position before subscribing to new events; the event stream alone cannot fill in updates sent while the device was offline. When the volunteer marks arrival, the watcher stops and the final point remains available for the handover record."))

story.append(PageBreak())
story.append(heading("VI", "Security and Notification Design"))
story.append(P("Authentication begins with the password hash maintained by the user model. After login, the server signs a JWT that is evaluated by the REST middleware and again during the socket handshake. Role guards then decide which donor, NGO, volunteer, or administrative operation is legal. We limited personal fields in API responses instead of returning complete user objects by default. Helmet headers, server-side validation, explicit allowed origins, and environment-only secrets add protection at deployment time."))
story.append(P("The mail path uses Gmail API OAuth 2.0 rather than an application-stored Gmail password. Separate messages cover submission, NGO acceptance, volunteer assignment, delivery, and distribution. The backend looks up the donor's saved address for every message. It does not trust a recipient supplied in the event request, which closes a simple route for redirecting notification mail."))
story.append(wide_figure_page(
    ("email_notification.png", "Fig. 7. Donor email notification for a dispatched food donation."),
))
story.append(P("A forgot-password request produces 32 random bytes. The user receives that original value as part of a short-lived URL, but the database stores only its SHA-256 digest and expiry time. On return, the service hashes the presented token before searching for an unexpired match. Both reset fields are erased after the password changes, so the same link cannot be accepted twice. Generic production responses avoid revealing whether an account exists."))
story.append(subheading("A", "Email Events and Failure Handling"))
story.append(P("Notifications turn an internal state change into information a participant can act on. A submission message confirms that the donation was recorded; acceptance tells the donor that an NGO has taken responsibility for the request; assignment and dispatch help set expectations around collection; and delivery closes the transport leg. The visible message in Fig. 7 includes item, quantity, partner, volunteer, status, and the two locations. Those details are useful, but they should be drawn from the saved pickup and donation records so that the email does not become a second, inconsistent source of truth."))
story.append(P("Email delivery is an external dependency. A successful state transition should not be silently undone because a mail provider is temporarily unavailable. In a mature deployment, notification attempts should be logged with a delivery state, retried with bounded backoff, and made idempotent so a retry does not send duplicate messages. The current paper describes the OAuth-based mail path and its intended events; actual delivery rates and recovery behavior still need measurement under provider and network failures."))
story.append(P("Password recovery needs a different message policy from routine progress updates. Reset links grant temporary authority and should be short-lived, single-use, and sent only to the address already associated with the account. A response should not reveal whether an email is registered. The stored digest allows the service to validate the returned secret without keeping the usable token in the database. These controls reduce the impact of a database disclosure, though they do not replace account recovery monitoring or secure transport."))

security = [
    [P("Threat", small), P("Control", small)],
    [P("Unauthorized API use", small), P("JWT validation and role guards", small)],
    [P("Tracking eavesdropping", small), P("Authenticated, pickup-specific Socket.IO rooms", small)],
    [P("Forged GPS payload", small), P("Role, assignment, numeric range, and accuracy validation", small)],
    [P("Reset-token database leak", small), P("Random raw token; only SHA-256 digest persisted", small)],
    [P("Credential disclosure", small), P("Server-side environment variables and OAuth 2.0", small)],
]
st = Table(security, colWidths=[0.38*COL_W, 0.62*COL_W], repeatRows=1)
st.setStyle(TableStyle([
    ("GRID", (0,0), (-1,-1), 0.45, colors.black), ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e8e8e8")),
    ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 2),
    ("RIGHTPADDING", (0,0), (-1,-1), 2), ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
]))
story.append(P("TABLE II. SECURITY CONTROLS", caption))
story.append(st)
story.append(P("The controls in Table II address different trust boundaries. JWT validation establishes which account made a request, while role checks and pickup relationships establish what that account may do. Coordinate validation checks the shape and range of data, but it cannot establish that a device is physically at the reported location. Likewise, TLS and an authenticated socket protect a message in transit, but they do not make a compromised phone trustworthy. The interface therefore presents location accuracy and update time as evidence quality, not as proof of custody."))
story.append(P("Security also depends on minimizing the information returned. A donor needs the progress of their own donations, not a directory of volunteer journeys. An assigned volunteer needs the pickup instructions, not every open donation. NGO users need their own accepted work and relevant listings. Administrative access is broader, so it should be restricted to operational staff and audited. These boundaries should be tested with both permitted and denied requests because a polished role dashboard can conceal an overly permissive API."))

story.append(heading("VII", "Operational Scenarios and Acceptance Criteria"))
story.append(P("Consider a donor who posts prepared food near its usable-until time. The NGO reviews the category, quantity, location, and expiry details, then accepts the offer. At that point the system should retain the acceptance event and create a pickup with an intended destination. If the NGO changes its mind or cannot provide a courier, the record should show the unresolved state clearly so that the donor can decide whether to offer the food elsewhere. A listing that remains labelled available after acceptance would invite duplicate claims."))
story.append(P("After a volunteer is assigned, the volunteer confirms receipt at the pickup point and begins travel. The donor and accepting NGO can follow updates while the trip is active. If the volunteer loses connectivity, the map should indicate that the last coordinate is stale and show when it was received. The last known point can still help participants coordinate, but it should not be mistaken for a current position. On reconnection, the client can retrieve the latest persisted location and resume receiving events. If the volunteer cannot complete the route, the pickup should remain in an explicit state that allows the NGO to reassign it under a controlled process."))
story.append(P("Arrival is another boundary worth making explicit. A marker near the NGO address is only a location observation; it does not mean the recipient has taken custody. The volunteer's Arrived action records a reported arrival and stops the live watcher. The NGO's confirmation records delivery, and a subsequent distribution record describes what happened to the food after receipt. Separating these actions makes it possible to investigate a late or disputed handover without treating GPS as a substitute for human confirmation."))
story.append(P("We translate these scenarios into acceptance criteria for a pilot. A donation should have one current acceptance outcome; a pickup should have one authorized volunteer at a time unless reassignment is recorded; illegal state jumps should be rejected; and each accepted transition should be attributable to an actor and timestamp. A viewer outside the pickup relationship should fail to join its live room. An invalid coordinate should be rejected, and a disconnected client should be able to identify the age of the last update. These criteria are specific enough to test but do not imply that a user study or field deployment has already validated them."))
story.append(P("A useful test set should include ordinary completion as well as failure. Examples include an expired listing, an NGO accepting a quantity smaller than the offer, a volunteer declining an assignment, a device denying location permission, a GPS fix with poor accuracy, a network interruption during travel, a repeated event after reconnect, and an email provider error. For each case, the team should record the initial state, action, expected result, actual result, and any recovery step. Such records can expose gaps that a successful happy-path demonstration will miss."))

story.append(heading("VIII", "Implementation Verification and Discussion"))
story.append(P("We verified the code that is present rather than estimating benefits that have not yet been measured. The backend passed its TypeScript production compile. The React and Vite build also completed, transforming 1,939 modules and creating deployable assets; its only reported issue was a non-fatal warning about the main bundle size. Repository inspection located the seven-state transition map, <font name='Courier'>watchPosition()</font>, authenticated join handlers, pickup-room broadcasts, Gmail OAuth code, Google and OSRM routing paths, and the hashed reset-token fields."))
verify = [
    [P("Verification item", small), P("Observed result", small)],
    [P("Backend production compile", small), P("Passed", small)],
    [P("Frontend TypeScript + Vite build", small), P("Passed; optimization warning only", small)],
    [P("Pickup transition graph", small), P("Exact seven-stage sequence enforced", small)],
    [P("Realtime authorization", small), P("Identity and pickup relationship checked before room join", small)],
    [P("Location broadcast scope", small), P("Pickup-specific room only", small)],
    [P("Reset lifecycle", small), P("Random token, stored hash, expiry, post-use clearing", small)],
]
vt = Table(verify, colWidths=[0.46*COL_W, 0.54*COL_W], repeatRows=1)
vt.setStyle(TableStyle([
    ("GRID", (0,0), (-1,-1), 0.45, colors.black), ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e8e8e8")),
    ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 2),
    ("RIGHTPADDING", (0,0), (-1,-1), 2), ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
]))
story.append(P("TABLE III. BUILD AND STATIC VERIFICATION", caption))
story.append(vt)
story.append(P("These results demonstrate build completeness and confirm the inspected controls. They say nothing yet about kilograms of food saved, faster collection, route quality, concurrent connections, successful email delivery, or beneficiary outcomes. Those quantities require a real pilot with agreed measurement rules. Before a larger deployment, the main client bundle should also be split so users do not download unrelated features at startup."))

story.append(heading("IX", "Limitations and Future Work"))
story.append(P("Several limits come from the operating environment rather than the code. Volunteers may deny location access, lose mobile data, or use devices with inaccurate GPS. Detailed movement history can also reveal sensitive patterns. If breadcrumbs are enabled, the organization should obtain consent, restrict access, record who reads them, and delete them after a short stated period. OSRM may return uneven routes, while Google services introduce billing and quota considerations. OAuth configuration affects mail reliability. Food safety itself still depends on human procedures for packaging, temperature, expiry decisions, and accountable handover."))
story.append(P("A field exercise is the next useful test. Donors, NGO staff, volunteers, and administrators should perform complete pickups while the study records acceptance time, completed and failed pickups, duration of each state, expired items, travel distance, route deviation, socket delay, email delivery, and usability problems. Historical results could later support the allocation approach in [4] or volunteer-notification policies in [5]. Proof photographs, buffered offline positions, multilingual screens, anomaly warnings, and privacy-preserving impact summaries are further candidates, but each should be justified by pilot evidence."))

story.append(PageBreak())
story.append(heading("X", "Conclusion"))
story.append(P("SmartFoodRescue keeps the donation, the journey, and the final handover connected. The state machine makes custody changes explicit, while the socket checks keep a volunteer's live position inside the people involved in that pickup. REST saves the durable business record, Socket.IO moves short-lived location updates, Gmail OAuth sends important notices, and MongoDB preserves the history after the map stops moving. The React and Node.js production builds completed, making a controlled pilot the next realistic step. Only that field use can show whether the platform saves time, handles real operating conditions, and helps more food reach beneficiaries."))

story.append(heading("XI", "References"))
refs = [
    "[1] F. Ciulli, A. Kolk, and S. Boe-Lillegraven, \"Circularity Brokers: Digital Platform Organizations and Waste Recovery in Food Supply Chains,\" <i>J. Bus. Ethics</i>, vol. 167, pp. 299-331, 2020, doi: <link href='https://doi.org/10.1007/s10551-019-04160-5'>10.1007/s10551-019-04160-5</link>.",
    "[2] L. Principato, C. Trevisan, M. Formentini, L. Secondi, C. Comis, and C. A. Pratesi, \"The influence of sustainability and digitalisation on business model innovation: The case of a multi-sided platform for food surplus redistribution,\" <i>Ind. Mark. Manage.</i>, vol. 115, pp. 156-171, 2023, doi: <link href='https://doi.org/10.1016/j.indmarman.2023.09.001'>10.1016/j.indmarman.2023.09.001</link>.",
    "[3] N. Aloysius and J. Ananda, \"A Circular Economy Approach to Food Security and Poverty: a Case Study in Food Rescue in Sri Lanka,\" <i>Circ. Econ. Sust.</i>, vol. 3, pp. 1919-1940, 2023, doi: <link href='https://doi.org/10.1007/s43615-023-00255-4'>10.1007/s43615-023-00255-4</link>.",
    "[4] M. Mertzanidis, A. Psomas, and P. Verma, \"Automating Food Drop: The Power of Two Choices for Dynamic and Fair Food Allocation,\" arXiv:2406.06363, 2024. [Online]. Available: <link href='https://arxiv.org/abs/2406.06363'>https://arxiv.org/abs/2406.06363</link>.",
    "[5] V. Manshadi and S. Rodilitz, \"Online Policies for Efficient Volunteer Crowdsourcing,\" arXiv:2002.08474, 2020. [Online]. Available: <link href='https://arxiv.org/abs/2002.08474'>https://arxiv.org/abs/2002.08474</link>.",
    "[6] \"Bridging the Gap Between Donors and Recipients: A Digital Application to Food Donation,\" in <i>Proc. 5th Int. Conf. Communication, Computing and Electronics Systems (ICCCES)</i>, 2026, doi: <link href='https://doi.org/10.1109/ICCCES62661.2026.11436954'>10.1109/ICCCES62661.2026.11436954</link>.",
    "[7] Y. A. Kusumawati, V. Aurellia, Lasmy, K. Lukiyanto, M. B. Awang, and C. S. Han, \"From Waste to Worth: Enhancing Access to Edible Surplus Food Using a Mobile App for Better Distribution,\" <i>Procedia Comput. Sci.</i>, vol. 269, pp. 749-761, 2025, doi: <link href='https://doi.org/10.1016/j.procs.2025.09.018'>10.1016/j.procs.2025.09.018</link>.",
    "[8] M. Sammer <i>et al.</i>, \"AI-FEED: Prototyping an AI-Powered Platform for the Food Charity Ecosystem,\" <i>Int. J. Comput. Intell. Syst.</i>, 2024, doi: <link href='https://doi.org/10.1007/s44196-024-00656-9'>10.1007/s44196-024-00656-9</link>.",
    "[9] M. Yu <i>et al.</i>, \"Unlocking the potential of surplus food: A blockchain approach to enhance equitable distribution and address food insecurity in Italy,\" <i>Socio-Econ. Plan. Sci.</i>, vol. 93, art. 101868, 2024, doi: <link href='https://doi.org/10.1016/j.seps.2024.101868'>10.1016/j.seps.2024.101868</link>.",
    "[10] \"Digital platforms: mapping the territory of new technologies to fight food waste,\" <i>Brit. Food J.</i>, vol. 122, no. 5, pp. 1647-1669, 2020, doi: <link href='https://doi.org/10.1108/BFJ-06-2019-0391'>10.1108/BFJ-06-2019-0391</link>.",
]
for r in refs:
    story.append(P(r, refstyle))

pdf = pdfcanvas.Canvas(str(OUT), pagesize=A4)
pdf.setTitle("SmartFoodRescue IEEE Research Paper")
pdf.setAuthor("Divya Ambre; Sumit Ghogare; Tanvi Patil; Tanvi Shrirame")
pdf.setSubject("Secure food rescue and redistribution platform")

page_no = 1
while story:
    if page_no == 1:
        first_page(pdf, None)
        active_frames = first_frames
    else:
        pdf.setFont("Times-Roman", 7)
        pdf.setFillColor(colors.HexColor("#555555"))
        pdf.drawCentredString(PAGE_W / 2, 8 * mm, str(page_no))
        pdf.setFillColor(colors.black)
        active_frames = make_later_frames(str(page_no))

    if isinstance(story[0], WideFigurePage):
        plate = story.pop(0)
        draw_wide_figure_page(pdf, plate)
        if story:
            pdf.showPage()
        page_no += 1
        continue

    marker_index = next((i for i, item in enumerate(story) if isinstance(item, WideFigurePage)), len(story))
    remaining_flowables = story[:marker_index]
    following_items = story[marker_index:]
    before = len(remaining_flowables)
    for frame in active_frames:
        frame.addFromList(remaining_flowables, pdf)
    story = remaining_flowables + following_items
    if len(remaining_flowables) == before:
        raise RuntimeError(f"No flowables fit on page {page_no}; layout cannot progress")
    if story:
        pdf.showPage()
    page_no += 1

pdf.save()
print(OUT)
