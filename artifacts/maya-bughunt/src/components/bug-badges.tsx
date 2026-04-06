import React from "react";
import { BugCategory, BugSeverity, BugStatus } from "@workspace/api-client-react";
import { CATEGORY_COLORS, SEVERITY_COLORS, STATUS_COLORS } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";

export function SeverityBadge({ severity }: { severity: BugSeverity }) {
  return (
    <Badge variant="outline" className={`font-medium ${SEVERITY_COLORS[severity]}`} data-testid={`severity-badge-${severity}`}>
      {severity}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: BugStatus }) {
  return (
    <Badge variant="outline" className={`font-medium ${STATUS_COLORS[status]}`} data-testid={`status-badge-${status}`}>
      {status}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: BugCategory }) {
  return (
    <Badge variant="outline" className={`font-medium ${CATEGORY_COLORS[category]}`} data-testid={`category-badge-${category}`}>
      {category.replace("_", " ")}
    </Badge>
  );
}
