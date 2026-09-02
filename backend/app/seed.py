import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import User, Department, Project, Milestone, Alert, Document
from .auth import get_password_hash

def seed_db():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding departments...")
        deps = [
            Department(name="Roads & Highways (MoRTH)"),
            Department(name="Railways (MoR)"),
            Department(name="Housing & Urban Affairs (MoHUA)"),
            Department(name="Renewable Energy (MNRE)"),
            Department(name="Power & Grid (MoP)"),
            Department(name="Telecommunications (DoT)"),
        ]
        db.add_all(deps)
        db.commit()
        
        # Refresh departments to get IDs
        r_dept = deps[0].id
        rl_dept = deps[1].id
        u_dept = deps[2].id
        p_dept = deps[4].id
        t_dept = deps[5].id

        print("Seeding users...")
        pw_admin = get_password_hash("admin123")
        pw_manager = get_password_hash("manager123")
        pw_viewer = get_password_hash("viewer123")
        pw_default = get_password_hash("password123")

        users = [
            User(
                name="Super Admin (MoSPI)",
                email="admin@mospi.gov.in",
                password_hash=pw_admin,
                role="SUPER_ADMIN",
                status="Active"
            ),
            User(
                name="Project Manager (MoRTH)",
                email="manager@morth.gov.in",
                password_hash=pw_manager,
                role="PROJECT_MANAGER",
                department_id=r_dept,
                status="Active"
            ),
            User(
                name="Public Officer / Citizen",
                email="viewer@gov.in",
                password_hash=pw_viewer,
                role="VIEWER",
                status="Active"
            ),
            User(
                name="Super Admin Demo",
                email="admin@example.com",
                password_hash=pw_default,
                role="SUPER_ADMIN",
                status="Active"
            ),
            User(
                name="Project Manager Demo",
                email="manager@example.com",
                password_hash=pw_default,
                role="PROJECT_MANAGER",
                department_id=r_dept,
                status="Active"
            ),
            User(
                name="Viewer Demo",
                email="viewer@example.com",
                password_hash=pw_default,
                role="VIEWER",
                status="Active"
            ),
        ]
        db.add_all(users)
        db.commit()
        
        pm_user_id = users[1].id

        print("Seeding projects...")
        now = datetime.datetime.utcnow()
        
        # State definitions with coordinates
        states = [
            {"state": "Maharashtra", "lat": 19.75, "lng": 75.71, "district": "Mumbai"},
            {"state": "Delhi", "lat": 28.61, "lng": 77.20, "district": "New Delhi"},
            {"state": "Tamil Nadu", "lat": 11.12, "lng": 78.65, "district": "Chennai"},
            {"state": "Karnataka", "lat": 15.31, "lng": 75.71, "district": "Bengaluru"},
            {"state": "Uttar Pradesh", "lat": 26.84, "lng": 80.94, "district": "Lucknow"},
            {"state": "West Bengal", "lat": 22.98, "lng": 87.85, "district": "Kolkata"},
            {"state": "Gujarat", "lat": 22.25, "lng": 71.19, "district": "Ahmedabad"},
            {"state": "Telangana", "lat": 18.11, "lng": 79.01, "district": "Hyderabad"},
            {"state": "Rajasthan", "lat": 27.02, "lng": 74.21, "district": "Jaipur"},
            {"state": "Madhya Pradesh", "lat": 22.97, "lng": 78.65, "district": "Bhopal"},
            {"state": "Bihar", "lat": 25.09, "lng": 85.31, "district": "Patna"},
            {"state": "Kerala", "lat": 10.85, "lng": 76.27, "district": "Trivandrum"},
            {"state": "Andhra Pradesh", "lat": 15.91, "lng": 79.74, "district": "Vijayawada"},
            {"state": "Odisha", "lat": 20.95, "lng": 83.37, "district": "Bhubaneswar"},
            {"state": "Assam", "lat": 26.20, "lng": 92.93, "district": "Guwahati"},
            {"state": "Punjab", "lat": 31.14, "lng": 75.34, "district": "Amritsar"},
            {"state": "Haryana", "lat": 29.05, "lng": 76.08, "district": "Gurugram"},
            {"state": "Jammu and Kashmir", "lat": 33.77, "lng": 76.57, "district": "Srinagar"},
        ]
        
        projects_data = []
        
        # 1. Project with extreme delay prediction & financial anomaly (Maharashtra)
        p1 = Project(
            project_code="PRJ-M01",
            name="NH-48 Highway 6-Laning Expansion",
            description="Widening and modernization of the NH-48 corridor passing through Satara-Kolhapur stretches.",
            department_id=r_dept,
            state="Maharashtra",
            district="Satara",
            latitude=17.68,
            longitude=73.99,
            budget=1248.5,
            amount_spent=1023.7, # 82% spent
            progress=43.5, # 43% physical progress (disparity!)
            financial_progress=82.0,
            status="Delayed",
            risk_level="Critical",
            start_date=now - datetime.timedelta(days=400),
            expected_end_date=now + datetime.timedelta(days=100),
            created_by=pm_user_id
        )
        projects_data.append(p1)
        
        # 2. Project with milestone delay (Karnataka)
        p2 = Project(
            project_code="PRJ-K02",
            name="Bengaluru Metro Rail Line 3 Phase 1B",
            description="Metro rail construction spanning 18km with 12 underground stations.",
            department_id=u_dept,
            state="Karnataka",
            district="Bengaluru",
            latitude=12.97,
            longitude=77.59,
            budget=3450.0,
            amount_spent=1138.5, # 33% spent
            progress=33.9, # 33% physical progress
            financial_progress=33.0,
            status="In Progress",
            risk_level="High",
            start_date=now - datetime.timedelta(days=300),
            expected_end_date=now + datetime.timedelta(days=600),
            created_by=pm_user_id
        )
        projects_data.append(p2)

        # 3. Successful Completed Project (Gujarat)
        p3 = Project(
            project_code="PRJ-G03",
            name="Solar Park Integration and Grid Connection",
            description="Setting up 500MW solar park substation and grid interconnect lines.",
            department_id=p_dept,
            state="Gujarat",
            district="Patan",
            latitude=23.86,
            longitude=72.12,
            budget=680.0,
            amount_spent=678.2,
            progress=100.0,
            financial_progress=100.0,
            status="Completed",
            risk_level="Low",
            start_date=now - datetime.timedelta(days=500),
            expected_end_date=now - datetime.timedelta(days=30),
            actual_end_date=now - datetime.timedelta(days=20),
            created_by=pm_user_id
        )
        projects_data.append(p3)

        # Generate 27 other projects for states to fill the map
        for i, s in enumerate(states):
            # Skip states we already created manually to avoid duplicates
            if s["state"] in ["Maharashtra", "Karnataka", "Gujarat"]:
                continue
                
            code = f"PRJ-GEN{i:02d}"
            name = f"{s['state']} {['Power Grid Upgrade', 'National Highway Bypass', 'Optical Fiber Link', 'Urban Transit Bypass', 'Railway Electrification'][i % 5]}"
            dept_id = [p_dept, r_dept, t_dept, u_dept, rl_dept][i % 5]
            
            # Vary progress and risk levels
            progress_pct = float((i * 7 + 13) % 95 + 5)
            budget = float((i * 120 + 350) % 2000 + 100)
            spent = float(budget * (progress_pct / 100) * (1.0 + ((i % 3 - 1) * 0.1)))
            spent = round(min(spent, budget), 2)
            
            if progress_pct > 95:
                status = "Completed"
                risk = "Low"
                start = now - datetime.timedelta(days=360)
                end = now - datetime.timedelta(days=10)
                actual_end = now - datetime.timedelta(days=15)
            elif progress_pct < 20:
                status = "Planning"
                risk = "Low"
                start = now - datetime.timedelta(days=20)
                end = now + datetime.timedelta(days=400)
                actual_end = None
            else:
                status = "In Progress"
                risk = ["Low", "Medium", "High"][i % 3]
                # Force some delays
                if i % 4 == 0:
                    status = "Delayed"
                    risk = "High" if i % 2 == 0 else "Critical"
                start = now - datetime.timedelta(days=180)
                end = now + datetime.timedelta(days=180)
                actual_end = None
                
            proj = Project(
                project_code=code,
                name=name,
                description=f"Standard central sector development scheme for {name} in state of {s['state']}.",
                department_id=dept_id,
                state=s["state"],
                district=s["district"],
                latitude=s["lat"],
                longitude=s["lng"],
                budget=budget,
                amount_spent=spent,
                progress=progress_pct,
                financial_progress=round((spent / budget) * 100, 2),
                status=status,
                risk_level=risk,
                start_date=start,
                expected_end_date=end,
                actual_end_date=actual_end,
                created_by=pm_user_id
            )
            projects_data.append(proj)
            
        db.add_all(projects_data)
        db.commit()
        
        print("Seeding milestones...")
        # Add milestones for Project 1 (NH-48 Highway - High Delay)
        p1_id = p1.id
        m1s = [
            Milestone(
                project_id=p1_id,
                name="M-01: Environment & Land Clearances",
                description="Acquisition of forest land clearings and NOC from State Pollution Board",
                planned_date=now - datetime.timedelta(days=350),
                actual_date=now - datetime.timedelta(days=330),
                status="Completed",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p1_id,
                name="M-02: Civil Mobilization & Excavation",
                description="Procurement of heavy excavators and grading of Sector 1 & 2",
                planned_date=now - datetime.timedelta(days=250),
                actual_date=now - datetime.timedelta(days=220),
                status="Completed",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p1_id,
                name="M-03: Foundation Concrete Laying",
                description="Sub-grade concrete filling across Sector 1-4",
                planned_date=now - datetime.timedelta(days=100),
                actual_date=now - datetime.timedelta(days=90),
                status="Completed",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p1_id,
                name="M-04: Main Structure/Bridge Construction",
                description="Erection of flyover girders and main deck slabs at Satara junction",
                planned_date=now - datetime.timedelta(days=30), # Planned in the past
                actual_date=None, # Incomplete
                status="Delayed",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p1_id,
                name="M-05: Pavement & Tarring Works",
                description="Top course blacktopping and asphalt compression",
                planned_date=now + datetime.timedelta(days=40),
                actual_date=None,
                status="Not Started",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p1_id,
                name="M-06: Lighting and Signaling Installation",
                description="Setting up smart toll plazas and highway indicators",
                planned_date=now + datetime.timedelta(days=90),
                actual_date=None,
                status="Not Started",
                responsible_user_id=pm_user_id
            ),
        ]
        db.add_all(m1s)
        
        # Add milestones for Project 2 (Bengaluru Metro)
        p2_id = p2.id
        m2s = [
            Milestone(
                project_id=p2_id,
                name="M-01: Soil Profile & Utilities Mapping",
                description="Mapping sewer lines and water supply links along Bengaluru Line 3",
                planned_date=now - datetime.timedelta(days=280),
                actual_date=now - datetime.timedelta(days=275),
                status="Completed",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p2_id,
                name="M-02: Underground Excavation & Pier Erection",
                description="Tunnel boring machines deployment and pier foundations setup",
                planned_date=now - datetime.timedelta(days=120),
                actual_date=None, # Overdue
                status="Delayed",
                responsible_user_id=pm_user_id
            ),
            Milestone(
                project_id=p2_id,
                name="M-03: Station Structural Layout",
                description="Laying structural framework for 12 transit stations",
                planned_date=now + datetime.timedelta(days=120),
                actual_date=None,
                status="In Progress",
                responsible_user_id=pm_user_id
            ),
        ]
        db.add_all(m2s)

        # Generate simple milestones for general projects
        for proj in projects_data[3:]:
            p_id = proj.id
            if proj.status == "Completed":
                status1, status2 = "Completed", "Completed"
                act1, act2 = now - datetime.timedelta(days=200), now - datetime.timedelta(days=50)
            elif proj.status == "Planning":
                status1, status2 = "Not Started", "Not Started"
                act1, act2 = None, None
            else:
                status1, status2 = "Completed", "In Progress"
                act1, act2 = now - datetime.timedelta(days=100), None
                
            db.add(Milestone(
                project_id=p_id,
                name="M-01: Administrative Approval & Tender",
                planned_date=now - datetime.timedelta(days=150),
                actual_date=act1,
                status=status1,
                responsible_user_id=pm_user_id
            ))
            db.add(Milestone(
                project_id=p_id,
                name="M-02: Core Structural Development",
                planned_date=now + datetime.timedelta(days=100),
                actual_date=act2,
                status=status2,
                responsible_user_id=pm_user_id
            ))
            
        db.commit()

        print("Seeding alerts & anomalies...")
        # Create alerts manually for seeded discrepancies
        alerts = [
            # Budget vs Progress discrepancy (Project 1 - NH-48 Satara)
            Alert(
                project_id=p1.id,
                type="Budget",
                severity="Critical",
                message="Financial expenditure has reached 82.0% (₹1023.7 Cr) while physical progress is lagging at only 43.5%. Potential budget overrun risk.",
                status="unread",
                created_at=now - datetime.timedelta(days=5)
            ),
            # Overdue Milestone (Project 1 - NH-48 Satara)
            Alert(
                project_id=p1.id,
                type="Milestone",
                severity="High",
                message="Critical milestone 'M-04: Main Structure/Bridge Construction' was planned for completion on " + (now - datetime.timedelta(days=30)).strftime("%d-%m-%Y") + " and is now 30 days overdue.",
                status="unread",
                created_at=now - datetime.timedelta(days=3)
            ),
            # Overdue Milestone (Project 2 - Bengaluru Metro)
            Alert(
                project_id=p2.id,
                type="Milestone",
                severity="High",
                message="Milestone 'M-02: Underground Excavation & Pier Erection' is past its scheduled deadline and remains incomplete.",
                status="unread",
                created_at=now - datetime.timedelta(days=2)
            ),
            # ML Risk prediction alert
            Alert(
                project_id=p1.id,
                type="Risk",
                severity="Critical",
                message="ProjectPulse AI delay prediction engine estimates a 92% delay probability with an expected schedule overrun of 42 days.",
                status="unread",
                created_at=now - datetime.timedelta(days=1)
            ),
        ]
        db.add_all(alerts)
        db.commit()
        
        print("Database seeded successfully with realistic test dataset!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
