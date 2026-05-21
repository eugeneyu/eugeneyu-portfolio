document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // ----------------------------------------------------
    // 2. LANGUAGE STATE MANAGEMENT (PERSISTENT EN/ZH)
    // ----------------------------------------------------
    const body = document.body;
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const langBtnText = document.getElementById('lang-btn-text');

    // Retrieve saved language or default to 'en'
    let currentLang = localStorage.getItem('eugene-portfolio-lang') || 'en';
    setLanguage(currentLang);

    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        setLanguage(currentLang);
    });

    function setLanguage(lang) {
        if (lang === 'zh') {
            body.classList.remove('lang-en');
            body.classList.add('lang-zh');
            langBtnText.textContent = 'English';
            localStorage.setItem('eugene-portfolio-lang', 'zh');
        } else {
            body.classList.remove('lang-zh');
            body.classList.add('lang-en');
            langBtnText.textContent = '中文';
            localStorage.setItem('eugene-portfolio-lang', 'en');
        }
        // Refresh terminal state text if active or clear
        updateTerminalLanguage();
    }


    // ----------------------------------------------------
    // 3. AMBIENT PARTICLES CANVAS (GCP HIGH-TECH GRID)
    // ----------------------------------------------------
    const canvas = document.getElementById('ambient-canvas');
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    const numberOfParticles = 75;
    let mouse = { x: null, y: null, radius: 140 };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.baseX = this.x;
            this.baseY = this.y;
            this.color = Math.random() > 0.5 ? 'rgba(0, 242, 254, 0.4)' : 'rgba(127, 0, 255, 0.4)';
        }

        update() {
            // Movement physics
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce on boundaries
            if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
            if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;

            // Mouse interaction (faint attraction/repulsion)
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.hypot(dx, dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    // Faint pull towards cursor
                    this.x += (dx / distance) * force * 0.8;
                    this.y += (dy / distance) * force * 0.8;
                }
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particlesArray = [];
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    initParticles();

    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.hypot(dx, dy);

                if (distance < 120) {
                    opacityValue = (1 - (distance / 120)) * 0.15;
                    ctx.strokeStyle = `rgba(0, 242, 254, ${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        connectParticles();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();


    // ----------------------------------------------------
    // 4. CUSTOM CURSOR PHYSICS & EFFECTS
    // ----------------------------------------------------
    const cursorRing = document.getElementById('custom-cursor');
    const cursorDot = document.getElementById('custom-cursor-dot');
    let cursorTargetX = 0, cursorTargetY = 0;
    let cursorRingX = 0, cursorRingY = 0;

    window.addEventListener('mousemove', (e) => {
        cursorTargetX = e.clientX;
        cursorTargetY = e.clientY;
        
        // Immediate dot tracking
        cursorDot.style.left = `${cursorTargetX}px`;
        cursorDot.style.top = `${cursorTargetY}px`;
    });

    // Smooth lerping for outer cursor ring
    function updateCursorRing() {
        const dx = cursorTargetX - cursorRingX;
        const dy = cursorTargetY - cursorRingY;
        
        // Ring follows with slight lag (0.15 interpolation factor)
        cursorRingX += dx * 0.15;
        cursorRingY += dy * 0.15;
        
        cursorRing.style.left = `${cursorRingX}px`;
        cursorRing.style.top = `${cursorRingY}px`;
        
        requestAnimationFrame(updateCursorRing);
    }
    updateCursorRing();

    // Hover Scaling for Cursor
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .project-card, .timeline-content');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorRing.style.width = '60px';
            cursorRing.style.height = '60px';
            cursorRing.style.borderColor = 'rgba(127, 0, 255, 0.8)';
            cursorRing.style.boxShadow = '0 0 20px rgba(127, 0, 255, 0.3)';
        });
        el.addEventListener('mouseleave', () => {
            cursorRing.style.width = '40px';
            cursorRing.style.height = '40px';
            cursorRing.style.borderColor = 'rgba(0, 242, 254, 0.3)';
            cursorRing.style.boxShadow = 'none';
        });
    });


    // ----------------------------------------------------
    // 5. NAVBAR SCROLL EFFECT
    // ----------------------------------------------------
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });


    // ----------------------------------------------------
    // 6. MOBILE NAV DRAWER TOGGLE
    // ----------------------------------------------------
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    const menuIcon = document.getElementById('menu-icon');

    mobileMenuBtn.addEventListener('click', () => {
        const isActive = mobileNav.classList.toggle('active');
        if (isActive) {
            menuIcon.setAttribute('data-lucide', 'x');
        } else {
            menuIcon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    });

    // Close mobile menu on clicking any link
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            menuIcon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        });
    });


    // ----------------------------------------------------
    // 7. 3D PROJECT CARD TILT SYSTEM (PERFECT PHYSIC TRANSFORM)
    // ----------------------------------------------------
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            // Mouse coordinates relative to card
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalize relative mouse vectors (-0.5 to 0.5)
            const normalizedX = (x / rect.width) - 0.5;
            const normalizedY = (y / rect.height) - 0.5;
            
            // Max degrees to tilt (e.g. 10 deg)
            const maxTilt = 10;
            const tiltX = -normalizedY * maxTilt;
            const tiltY = normalizedX * maxTilt;
            
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0deg)';
        });
    });


    // ----------------------------------------------------
    // 8. TIMELINE INTERSECTION OBSERVER REVEAL EFFECT
    // ----------------------------------------------------
    const revealItems = document.querySelectorAll('.reveal-item');
    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealItems.forEach(item => {
        revealObserver.observe(item);
    });


    // ----------------------------------------------------
    // 9. INTERACTIVE BASH TERMINAL ENGINE
    // ----------------------------------------------------
    const terminalBody = document.getElementById('terminal-body');
    const terminalInput = document.getElementById('terminal-input');
    const termInputLine = document.getElementById('term-input-line');

    // Make clicking the body of the terminal focus the input
    document.querySelector('.terminal-container').addEventListener('click', () => {
        terminalInput.focus();
    });

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const inputVal = terminalInput.value.trim();
            executeTerminalCommand(inputVal);
            terminalInput.value = '';
        }
    });

    // Language switcher support within terminal outputs
    function updateTerminalLanguage() {
        // Keeps state clean. No special action required, standard runs fetch current language.
    }

    const commandHistory = [];
    
    // Technical skills data
    const skillsEN = `
=== GOOGLE CLOUD ARCHITECTURE SUITE ===
• Infrastructure: GKE, Compute Engine, VPC Routing, Cloud Interconnect, VPN Setup
• Big Data/Analytics: Cloud Dataflow, BigQuery, Pub/Sub, Cloud Storage, Dataproc
• Serverless: Cloud Functions, Cloud Run, API Gateway, App Engine
• Media & AI: Vertex AI, Gemini models, Transcoder API, Video Intelligence
• Development Tools: gcloud CLI, Terraform, Deployment Manager
• Core Languages: Python, Shell, Java, PHP, JavaScript, SQL
`;
    const skillsZH = `
=== 谷歌云架构技术栈 ===
• 基础设施: GKE(K8s), Compute Engine, VPC 路由编排, 专线物理网, VPN 网关
• 大数据与分析: Cloud Dataflow, BigQuery, Pub/Sub, Cloud Storage, Dataproc
• 无服务器架构: Cloud Functions, Cloud Run, API 网关
• 媒体与人工智能: Vertex AI 大模型平台, Gemini API 落地, Transcoder API 自动化媒资转码
• 开发工具: gcloud CLI, Terraform 基础设施即代码, YAML
• 核心语言: Python, Shell 脚本, Java, PHP, JavaScript, SQL 数据库
`;

    function executeTerminalCommand(cmdText) {
        if (!cmdText) {
            appendTerminalLine('eugeneyu@cloud:~$', 'term-prompt');
            return;
        }

        // Add to history
        commandHistory.push(cmdText);

        // Echo command typed
        const echoLine = document.createElement('div');
        echoLine.className = 'term-line';
        echoLine.innerHTML = `<span class="term-prompt">eugeneyu@cloud:~$</span> <span>${escapeHtml(cmdText)}</span>`;
        terminalBody.insertBefore(echoLine, termInputLine);

        const lowerCmd = cmdText.toLowerCase();

        // Interpret commands
        let response = '';
        const lang = document.body.classList.contains('lang-zh') ? 'zh' : 'en';

        switch (lowerCmd) {
            case 'help':
            case '帮助':
                if (lang === 'zh') {
                    response = `
可用架构师命令列表:
  <span class="term-highlight">about</span> | <span class="term-highlight">关于</span>     - 打印于有志(Eugene)个人简历与核心理念
  <span class="term-highlight">skills</span> | <span class="term-highlight">技能</span>    - 查看谷歌云高级技术堆栈及开发语言
  <span class="term-highlight">projects</span> | <span class="term-highlight">项目</span>  - 导出 GitHub 核心开源项目详情及仓库链接
  <span class="term-highlight">milestones</span> | <span class="term-highlight">里程碑</span>- 获取稀土开发者大会 XDC2024 等重要活动足迹
  <span class="term-highlight">contact</span> | <span class="term-highlight">联系</span>   - 检索安全网络连接信道 (LinkedIn, GitHub)
  <span class="term-highlight">clear</span> | <span class="term-highlight">清屏</span>     - 清除当前控制台的所有输出信息
`;
                } else {
                    response = `
List of available architect commands:
  <span class="term-highlight">about</span>      - Print Eugene Yu's profile summary & architectural vision
  <span class="term-highlight">skills</span>     - Review advanced Google Cloud & software engineering stack
  <span class="term-highlight">projects</span>   - Export details of public GitHub repositories & source codes
  <span class="term-highlight">milestones</span> - Retrieve major industry milestones (e.g., XDC 2024)
  <span class="term-highlight">contact</span>    - Show secure pathways to establish connection (LinkedIn, GitHub)
  <span class="term-highlight">clear</span>      - Clean up current terminal environment
`;
                }
                appendTerminalOutput(response);
                break;

            case 'about':
            case '关于':
                if (lang === 'zh') {
                    response = `
于有志 (Eugene Yu) 是 Google Cloud 首席架构师。
核心理念：
  “构建坚如磐石的云底层，支撑大模型时代的每一次敏捷起飞。”
他致力于将高弹性、高可用的多地域云基础设施，与最前沿的生成式 AI/LLM 开发生态打通，为大型企业及创业团队制定卓越的云原生落地蓝图。
`;
                } else {
                    response = `
Eugene Yu is a Google Cloud Chief Architect.
Core Philosophy:
  "Designing bulletproof cloud foundations to power hyperscale computing in the LLM era."
He specializes in translating massive multi-region server clusters and complex cloud networking systems into clean, automated, enterprise-ready digital structures.
`;
                }
                appendTerminalOutput(response);
                break;

            case 'skills':
            case '技能':
                response = lang === 'zh' ? skillsZH : skillsEN;
                appendTerminalOutput(response);
                break;

            case 'projects':
            case '项目':
                if (lang === 'zh') {
                    response = `
=== 开源项目目录 ===
1. <span class="term-highlight">cdn_prefetch</span> (Python) - 高吞吐 CDN 缓存刷新及调度预热程序
2. <span class="term-highlight">custom-reverse-proxy</span> (Shell) - 生产级轻量安全反向代理网关配置
3. <span class="term-highlight">cloud-demos</span> (Jupyter Notebook) - 云资源部署实例及 Data flow 配置演示
4. <span class="term-highlight">lianjia-beike-spider</span> (Python) - 支持多核心城市的房价采集器
5. <span class="term-highlight">DataflowDemos</span> (Java) - 谷歌 Dataflow 模板消息流批处理流水线
`;
                } else {
                    response = `
=== GitHub Repositories Summary ===
1. <span class="term-highlight">cdn_prefetch</span> (Python) - Low-latency prefetching agent to update CDN edge nodes
2. <span class="term-highlight">custom-reverse-proxy</span> (Shell) - Production-hardened reverse-proxy configurations
3. <span class="term-highlight">cloud-demos</span> (Jupyter) - GCP pipeline scripts, walkthrough templates & deployment demo configs
4. <span class="term-highlight">lianjia-beike-spider</span> (Python) - Highly parallel spider capturing real estate data for 21 cities
5. <span class="term-highlight">DataflowDemos</span> (Java) - Specialized Stream/Batch Cloud Dataflow template pipelines
`;
                }
                appendTerminalOutput(response);
                break;

            case 'milestones':
            case '里程碑':
                if (lang === 'zh') {
                    response = `
=== 技术活动与行业足迹 ===
• <span class="term-highlight">[2024] 稀土开发者大会圆桌嘉宾</span>
  圆桌大纲：《大模型时代的创新与创业机遇》
  作为 Google Cloud 首席架构师，与行业先锋、独角兽企业高管共同剖析大模型应用落地、算力成本，并分享谷歌 Responsible AI 设计核心。
• <span class="term-highlight">[云技术实践] InfoQ 深度发表</span>
  - 《Transcoder API 自动化视频转码工作流》：Serverless 架构与事件消息队列集成。
  - 《公有云环境中使用 VPN 访问谷歌云 API》：高可用多云互联安全网络拓扑设计。
`;
                } else {
                    response = `
=== Key Milestones & Footprints ===
• <span class="term-highlight">[2024] Roundtable Panelist @ XDC 2024</span>
  Panel Focus: "Innovation and Entrepreneurship Opportunities in the Era of Large Models."
  Provided strategic insights into computing optimizations, cost control for Generative AI, and shared Google's AI principles.
• <span class="term-highlight">[Technical Publications] In-depth Guides on InfoQ</span>
  - "Automated Video Transcoding Workflows with GCP Transcoder API"
  - "Cross-Cloud API Access via secure Encrypted IPSec VPN"
`;
                }
                appendTerminalOutput(response);
                break;

            case 'contact':
            case '联系':
                if (lang === 'zh') {
                    response = `
=== 建立网络连接信道 ===
• <span class="term-highlight">LinkedIn:</span> https://www.linkedin.com/in/youzhi-eugene-yu/
• <span class="term-highlight">GitHub:</span> https://github.com/eugeneyu
• 状态: 信道就绪。欢迎发送会话请求！
`;
                } else {
                    response = `
=== Secure Pathways to Establish Connection ===
• <span class="term-highlight">LinkedIn:</span> https://www.linkedin.com/in/youzhi-eugene-yu/
• <span class="term-highlight">GitHub:</span> https://github.com/eugeneyu
• status: Gateway active. Waiting for connection stream...
`;
                }
                appendTerminalOutput(response);
                break;

            case 'clear':
            case '清屏':
                // Remove all lines except input line
                const lines = terminalBody.querySelectorAll('.term-line');
                lines.forEach(line => line.remove());
                break;

            default:
                if (lang === 'zh') {
                    response = `终端: 未找到架构师命令: <span class="term-highlight">${escapeHtml(cmdText)}</span>。输入 '<span class="term-highlight">help</span>' 获取支持。`;
                } else {
                    response = `shell: command not found: <span class="term-highlight">${escapeHtml(cmdText)}</span>. Type '<span class="term-highlight">help</span>' for options.`;
                }
                appendTerminalOutput(response);
        }

        // Scroll terminal to bottom
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function appendTerminalLine(text, className = '') {
        const line = document.createElement('div');
        line.className = 'term-line ' + className;
        line.innerHTML = text;
        terminalBody.insertBefore(line, termInputLine);
    }

    function appendTerminalOutput(multilineText) {
        const cleanText = multilineText.trim();
        const rows = cleanText.split('\n');
        rows.forEach(row => {
            appendTerminalLine(row);
        });
    }

    function escapeHtml(string) {
        return String(string).replace(/[&<>"']/g, function (s) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[s];
        });
    }
});
