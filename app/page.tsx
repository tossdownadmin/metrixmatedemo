import { currentAnchor } from "@/lib/demo-data";
import DemoApp from "@/components/demo-app";
export default function Page() { return <DemoApp anchor={currentAnchor()} />; }
