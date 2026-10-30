import ProjectWorkspace from "@/components/ProjectWorkspace";

export const metadata = { title: "Project · Unramble" };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectWorkspace id={id} />;
}
