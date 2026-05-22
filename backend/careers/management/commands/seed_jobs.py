from django.core.management.base import BaseCommand
from careers.models import Category, Skill, Job


CATEGORIES = [
    "Backend Development",
    "Frontend Development",
    "Full Stack Development",
    "Data Science & ML",
    "DevOps & Cloud",
    "Mobile Development",
    "Cybersecurity",
]

SKILLS = {
    "Backend Development": [
        "Python", "Django", "FastAPI", "Flask", "Node.js", "Express",
        "Java", "Go", "REST API", "GraphQL API", "Microservices",
        "PostgreSQL", "Redis", "Celery", "SQLAlchemy",
    ],
    "Frontend Development": [
        "React", "Vue", "Angular", "TypeScript", "JavaScript",
        "Next.js", "HTML", "CSS", "Tailwind", "Redux", "Webpack", "Vite",
    ],
    "Full Stack Development": [
        "Python", "React", "TypeScript", "PostgreSQL", "Docker",
        "REST API", "Git", "GitHub",
    ],
    "Data Science & ML": [
        "Machine Learning", "Deep Learning", "Python", "pandas", "numpy",
        "scikit-learn", "TensorFlow", "PyTorch", "Jupyter",
        "Data Analysis", "NLP", "Statistics",
    ],
    "DevOps & Cloud": [
        "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Linux",
        "CI/CD", "GitHub Actions", "Terraform", "Ansible",
        "Nginx", "Jenkins", "Prometheus", "Grafana",
    ],
    "Mobile Development": [
        "React Native", "Flutter", "Android", "iOS",
        "SwiftUI", "Jetpack Compose", "Expo",
    ],
    "Cybersecurity": [
        "Cybersecurity", "Penetration Testing", "OWASP",
        "Network Security", "Burp Suite", "Kali Linux",
        "Vulnerability Assessment", "Cryptography",
    ],
}

JOBS = [
    {
        "title": "Junior Python Developer",
        "company_name": "Tech Solutions Ltd",
        "category": "Backend Development",
        "job_type": "full_time",
        "experience_level": "entry",
        "is_remote": True,
        "location": "",
        "description": (
            "We are looking for a Junior Python Developer to join our growing engineering team. "
            "You will assist in building and maintaining backend services, working closely with "
            "senior developers to deliver high-quality software.\n\n"
            "Responsibilities:\n"
            "- Develop and maintain Python-based backend services\n"
            "- Write clean, well-documented code\n"
            "- Participate in code reviews\n"
            "- Collaborate with the team using Git\n\n"
            "We offer a friendly environment, mentorship, and the opportunity to grow quickly."
        ),
        "required_skills": ["Python", "REST API", "PostgreSQL", "Git"],
        "preferred_skills": ["Django", "Docker", "Flask"],
    },
    {
        "title": "Senior Django Developer",
        "company_name": "SoftCore Labs",
        "category": "Backend Development",
        "job_type": "full_time",
        "experience_level": "senior",
        "is_remote": False,
        "location": "Bucharest",
        "description": (
            "SoftCore Labs is hiring a Senior Django Developer to lead the development of "
            "scalable web applications. You will architect solutions, mentor junior developers, "
            "and work closely with product managers.\n\n"
            "Responsibilities:\n"
            "- Design and implement complex Django applications\n"
            "- Lead technical discussions and architecture decisions\n"
            "- Optimize database queries and application performance\n"
            "- Mentor junior team members\n\n"
            "We work with modern tooling and have a strong engineering culture."
        ),
        "required_skills": ["Python", "Django", "PostgreSQL", "REST API", "Docker"],
        "preferred_skills": ["Redis", "Celery", "GraphQL API", "Kubernetes"],
    },
    {
        "title": "Backend Python Engineer",
        "company_name": "CloudBridge Technologies",
        "category": "Backend Development",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": True,
        "location": "",
        "description": (
            "CloudBridge is looking for a mid-level Python engineer to work on our cloud-native "
            "backend platform. You will build microservices, design APIs, and work in an agile team.\n\n"
            "Responsibilities:\n"
            "- Build and maintain RESTful APIs using FastAPI or Django\n"
            "- Design database schemas and write efficient queries\n"
            "- Write automated tests and maintain CI/CD pipelines\n"
            "- Participate in daily standups and sprint planning\n\n"
            "Fully remote, async-first culture."
        ),
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
        "preferred_skills": ["Redis", "Celery", "Kubernetes", "AWS"],
    },
    {
        "title": "Junior React Developer",
        "company_name": "PixelCraft Studio",
        "category": "Frontend Development",
        "job_type": "full_time",
        "experience_level": "entry",
        "is_remote": False,
        "location": "Cluj-Napoca",
        "description": (
            "PixelCraft Studio is looking for a Junior React Developer to build beautiful and "
            "performant user interfaces. You will work under the guidance of senior frontend engineers "
            "on exciting client projects.\n\n"
            "Responsibilities:\n"
            "- Build reusable React components\n"
            "- Implement responsive layouts using CSS and Tailwind\n"
            "- Consume REST APIs and manage state with Redux\n"
            "- Write unit tests for components\n\n"
            "Great opportunity to learn and grow in a creative team."
        ),
        "required_skills": ["React", "JavaScript", "HTML", "CSS"],
        "preferred_skills": ["TypeScript", "Redux", "Tailwind", "Next.js"],
    },
    {
        "title": "Senior Frontend Engineer",
        "company_name": "DataFlow Inc.",
        "category": "Frontend Development",
        "job_type": "full_time",
        "experience_level": "senior",
        "is_remote": True,
        "location": "",
        "description": (
            "DataFlow is seeking a Senior Frontend Engineer to lead the development of our "
            "data visualization platform. You will own the frontend architecture and work "
            "closely with our design and backend teams.\n\n"
            "Responsibilities:\n"
            "- Architect and build complex React/TypeScript applications\n"
            "- Define frontend best practices and coding standards\n"
            "- Build data visualization components\n"
            "- Collaborate with UX designers to implement pixel-perfect interfaces\n\n"
            "Competitive salary, stock options, fully remote."
        ),
        "required_skills": ["React", "TypeScript", "JavaScript", "Redux", "Next.js"],
        "preferred_skills": ["GraphQL API", "Webpack", "Vite", "Tailwind"],
    },
    {
        "title": "Full Stack Developer (Python / React)",
        "company_name": "NovaBuild Ltd",
        "category": "Full Stack Development",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": True,
        "location": "",
        "description": (
            "NovaBuild is hiring a Full Stack Developer to work on our SaaS platform. "
            "You will be responsible for both backend APIs and frontend features, "
            "owning entire features end-to-end.\n\n"
            "Responsibilities:\n"
            "- Build Django REST APIs consumed by a React frontend\n"
            "- Implement UI components and integrate with backend\n"
            "- Deploy services using Docker and CI/CD pipelines\n"
            "- Write tests for both backend and frontend code\n\n"
            "Small team, high autonomy, remote-first."
        ),
        "required_skills": ["Python", "Django", "React", "TypeScript", "PostgreSQL", "Docker"],
        "preferred_skills": ["Redux", "REST API", "GitHub Actions", "Redis"],
    },
    {
        "title": "Data Scientist",
        "company_name": "InsightAI",
        "category": "Data Science & ML",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": True,
        "location": "",
        "description": (
            "InsightAI is looking for a Data Scientist to develop machine learning models "
            "that power our analytics platform. You will work with large datasets and "
            "collaborate with engineering to deploy models to production.\n\n"
            "Responsibilities:\n"
            "- Analyze large datasets and extract actionable insights\n"
            "- Train and evaluate machine learning models\n"
            "- Deploy models using MLflow and REST APIs\n"
            "- Communicate findings to non-technical stakeholders\n\n"
            "Work with cutting-edge ML technologies in a research-forward environment."
        ),
        "required_skills": ["Python", "Machine Learning", "pandas", "numpy", "scikit-learn"],
        "preferred_skills": ["TensorFlow", "PyTorch", "Deep Learning", "SQL Server", "Jupyter"],
    },
    {
        "title": "Machine Learning Engineer",
        "company_name": "DeepTech Ventures",
        "category": "Data Science & ML",
        "job_type": "full_time",
        "experience_level": "senior",
        "is_remote": True,
        "location": "",
        "description": (
            "DeepTech Ventures is hiring a Machine Learning Engineer to build production-grade "
            "ML systems. You will bridge the gap between research and engineering, deploying "
            "models at scale.\n\n"
            "Responsibilities:\n"
            "- Design ML pipelines for training, evaluation, and deployment\n"
            "- Optimize model performance and inference speed\n"
            "- Build data pipelines using Python and distributed systems\n"
            "- Collaborate with research scientists to productionize models\n\n"
            "Work on large-scale NLP and computer vision projects."
        ),
        "required_skills": ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Docker"],
        "preferred_skills": ["Kubernetes", "AWS", "NLP", "pandas", "numpy"],
    },
    {
        "title": "DevOps Engineer",
        "company_name": "Infrastructure Plus",
        "category": "DevOps & Cloud",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": False,
        "location": "Timisoara",
        "description": (
            "Infrastructure Plus is seeking a DevOps Engineer to automate and maintain our "
            "cloud infrastructure. You will manage CI/CD pipelines, container orchestration, "
            "and ensure high availability of our services.\n\n"
            "Responsibilities:\n"
            "- Manage Kubernetes clusters and Docker deployments\n"
            "- Build and maintain CI/CD pipelines with GitHub Actions\n"
            "- Monitor infrastructure with Prometheus and Grafana\n"
            "- Implement infrastructure as code using Terraform\n\n"
            "Work with a modern cloud-native stack."
        ),
        "required_skills": ["Docker", "Kubernetes", "Linux", "CI/CD", "GitHub Actions"],
        "preferred_skills": ["Terraform", "AWS", "Prometheus", "Grafana", "Ansible"],
    },
    {
        "title": "Cloud Engineer (AWS)",
        "company_name": "SkyNet Cloud",
        "category": "DevOps & Cloud",
        "job_type": "full_time",
        "experience_level": "senior",
        "is_remote": True,
        "location": "",
        "description": (
            "SkyNet Cloud is looking for a Senior Cloud Engineer to architect and manage "
            "our AWS infrastructure. You will lead cloud migrations and build reliable, "
            "scalable systems for enterprise clients.\n\n"
            "Responsibilities:\n"
            "- Design and implement AWS cloud architecture\n"
            "- Manage ECS, EKS, Lambda, RDS, and S3 workloads\n"
            "- Build infrastructure as code with Terraform\n"
            "- Ensure security, compliance, and cost optimization\n\n"
            "AWS certifications are a plus. Remote-friendly culture."
        ),
        "required_skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Linux", "CI/CD"],
        "preferred_skills": ["GCP", "Azure", "Ansible", "Python", "Jenkins"],
    },
    {
        "title": "React Native Developer",
        "company_name": "AppFactory",
        "category": "Mobile Development",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": True,
        "location": "",
        "description": (
            "AppFactory builds mobile applications for startups and enterprises. "
            "We are looking for a React Native Developer to join our mobile team and "
            "deliver cross-platform apps used by thousands of users.\n\n"
            "Responsibilities:\n"
            "- Build cross-platform mobile apps using React Native\n"
            "- Integrate with REST APIs and third-party SDKs\n"
            "- Publish and maintain apps on App Store and Google Play\n"
            "- Optimize app performance and user experience\n\n"
            "Fully remote, project-based work with long-term clients."
        ),
        "required_skills": ["React Native", "JavaScript", "TypeScript", "REST API"],
        "preferred_skills": ["Expo", "Android", "iOS", "Redux", "React"],
    },
    {
        "title": "Software Engineering Intern",
        "company_name": "StartupHub",
        "category": "Full Stack Development",
        "job_type": "internship",
        "experience_level": "entry",
        "is_remote": False,
        "location": "Bucharest",
        "description": (
            "StartupHub offers a 3-month paid internship for students and recent graduates "
            "eager to gain hands-on software development experience. You will work on real "
            "projects alongside experienced engineers.\n\n"
            "Responsibilities:\n"
            "- Contribute to Python or JavaScript projects under mentorship\n"
            "- Write and maintain automated tests\n"
            "- Participate in code reviews and team ceremonies\n"
            "- Learn and apply software engineering best practices\n\n"
            "Great stepping stone into your first full-time role."
        ),
        "required_skills": ["Python", "Git", "REST API"],
        "preferred_skills": ["React", "JavaScript", "Docker", "PostgreSQL"],
    },
    {
        "title": "Node.js Backend Developer",
        "company_name": "WebScale Corp",
        "category": "Backend Development",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": True,
        "location": "",
        "description": (
            "WebScale Corp is building high-performance APIs used by millions of users. "
            "We need a Node.js Backend Developer to help us scale our platform.\n\n"
            "Responsibilities:\n"
            "- Design and implement REST APIs using Node.js and Express\n"
            "- Optimize database queries for high-throughput workloads\n"
            "- Build real-time features using WebSockets\n"
            "- Contribute to system design discussions\n\n"
            "We offer competitive salaries and a distributed remote team."
        ),
        "required_skills": ["Node.js", "JavaScript", "REST API", "PostgreSQL", "Docker"],
        "preferred_skills": ["TypeScript", "Redis", "Express", "Microservices", "AWS"],
    },
    {
        "title": "Frontend Intern (React)",
        "company_name": "CreativeWeb Agency",
        "category": "Frontend Development",
        "job_type": "internship",
        "experience_level": "entry",
        "is_remote": False,
        "location": "Cluj-Napoca",
        "description": (
            "CreativeWeb Agency is a digital agency building websites and web apps for clients "
            "across Europe. We are looking for a Frontend Intern to join our team for 3-6 months.\n\n"
            "Responsibilities:\n"
            "- Implement UI designs using React and CSS\n"
            "- Work with senior developers on client projects\n"
            "- Learn modern frontend tools and workflows\n\n"
            "Great opportunity for students who want to build their portfolio."
        ),
        "required_skills": ["JavaScript", "HTML", "CSS", "React"],
        "preferred_skills": ["TypeScript", "Git", "Tailwind"],
    },
    {
        "title": "Cybersecurity Analyst",
        "company_name": "SecureNet",
        "category": "Cybersecurity",
        "job_type": "full_time",
        "experience_level": "mid",
        "is_remote": False,
        "location": "Bucharest",
        "description": (
            "SecureNet Romania is a cybersecurity firm protecting enterprise clients. "
            "We are looking for a Cybersecurity Analyst to join our SOC team.\n\n"
            "Responsibilities:\n"
            "- Monitor and investigate security incidents\n"
            "- Conduct vulnerability assessments and penetration tests\n"
            "- Develop and maintain security policies\n"
            "- Respond to security incidents and produce reports\n\n"
            "OSCP or CEH certification is a plus."
        ),
        "required_skills": ["Cybersecurity", "Network Security", "OWASP", "Vulnerability Assessment"],
        "preferred_skills": ["Penetration Testing", "Kali Linux", "Burp Suite", "Python"],
    },
]


class Command(BaseCommand):
    help = "Seed the database with sample categories, skills, and jobs"

    def handle(self, *args, **options):
        self.stdout.write("Seeding categories...")
        categories = {}
        for name in CATEGORIES:
            cat, created = Category.objects.get_or_create(name=name)
            categories[name] = cat
            if created:
                self.stdout.write(f"  Created category: {name}")

        self.stdout.write("Seeding skills...")
        skills = {}
        for cat_name, skill_names in SKILLS.items():
            cat = categories.get(cat_name)
            for skill_name in skill_names:
                skill, created = Skill.objects.get_or_create(
                    name=skill_name,
                    defaults={"category": cat},
                )
                skills[skill_name] = skill
                if created:
                    self.stdout.write(f"  Created skill: {skill_name}")

        self.stdout.write("Seeding jobs...")
        created_count = 0
        for job_data in JOBS:
            if Job.objects.filter(title=job_data["title"], company_name=job_data["company_name"]).exists():
                self.stdout.write(f"  Skipped (exists): {job_data['title']}")
                continue

            job = Job.objects.create(
                title=job_data["title"],
                company_name=job_data["company_name"],
                category=categories.get(job_data["category"]),
                job_type=job_data["job_type"],
                experience_level=job_data["experience_level"],
                is_remote=job_data["is_remote"],
                location=job_data.get("location", ""),
                description=job_data["description"],
                is_active=True,
            )

            for skill_name in job_data.get("required_skills", []):
                if skill_name in skills:
                    job.required_skills.add(skills[skill_name])

            for skill_name in job_data.get("preferred_skills", []):
                if skill_name in skills:
                    job.preferred_skills.add(skills[skill_name])

            created_count += 1
            self.stdout.write(f"  Created job: {job_data['title']}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} jobs created "
                f"({len(JOBS) - created_count} already existed)."
            )
        )
