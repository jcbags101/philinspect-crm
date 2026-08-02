import { getAppConfig } from "@/lib/config";
import { getDashboardCounts } from "@/lib/db";

const icons: Record<string, string> = { contacts: "CT", companies: "CO", leads: "LD", pipeline: "PL", tasks: "TK", audit: "AL" };

export default async function Dashboard() {
  const config = getAppConfig();
  const counts = await getDashboardCounts();
  const cards = [
    { key: "contacts", label: "Contacts", value: counts.contacts },
    { key: "companies", label: "Companies", value: counts.companies },
    { key: "leads", label: "Open leads", value: counts.leads },
    { key: "pipeline", label: "Pipeline value", value: "PHP " + counts.pipelineValue.toLocaleString() },
  ].filter((item) => config.modules.includes(item.key));

  return <main className="shell">
    <aside className="sidebar"><div className="brand"><span>AF</span><strong>{config.name}</strong></div><nav>{config.modules.map((module) => <a href={module === "pipeline" ? "#pipeline" : "#" + module} key={module}><i>{icons[module] || "MD"}</i>{module.charAt(0).toUpperCase() + module.slice(1)}</a>)}</nav><div className="workspace"><small>WORKSPACE</small><b>{config.client || "Your organization"}</b><span>Production</span></div></aside>
    <section className="content"><header><div><p>CRM OVERVIEW</p><h1>Good morning</h1><span>Your team has a clear path through today&apos;s work.</span></div><button>+ New record</button></header>
      <div className="metrics">{cards.map((card) => <article key={card.key}><small>{card.label}</small><strong>{card.value}</strong><span>Live workspace data</span></article>)}</div>
      <div className="grid"><article className="panel" id="pipeline"><div className="panelHead"><div><small>PIPELINE</small><h2>Deals by stage</h2></div><span>Current quarter</span></div><div className="empty"><b>Your pipeline is ready</b><p>Add the first lead or import existing CRM records to begin.</p><button>Create first lead</button></div></article>
      <article className="panel activity"><div className="panelHead"><div><small>ACTIVITY</small><h2>Latest updates</h2></div></div><ul><li><i></i><div><b>Workspace provisioned</b><span>CRM Core {config.version}</span></div></li><li><i></i><div><b>Roles configured</b><span>{config.roles.length} initial roles</span></div></li><li><i></i><div><b>Database connected</b><span>Isolated PostgreSQL</span></div></li></ul></article></div>
    </section>
  </main>;
}
