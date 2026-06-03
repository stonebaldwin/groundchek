// Utilities
export { cn } from "./lib/cn";
export { formatCurrency, formatDateShort, formatPercent } from "./lib/format";
export {
  ACTIVITY_META,
  activityMeta,
  type ActivityLevel,
  type ActivityMeta,
} from "./lib/activity";
export {
  PROJECT_TYPE_META,
  PROJECT_TYPE_ORDER,
  projectTypeMeta,
  type ProjectType,
  type ProjectTypeMeta,
} from "./lib/project-type";
export {
  PERMIT_STATUS_META,
  permitStatusMeta,
  type PermitStatus,
  type PermitStatusMeta,
  type StatusVariant,
} from "./lib/status";

// Primitives
export { Button, type ButtonProps } from "./primitives/button";
export { Input, type InputProps } from "./primitives/input";
export { Select, type SelectProps } from "./primitives/select";
export { Badge, type BadgeProps } from "./primitives/badge";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./primitives/card";
export { StatCard, type StatCardProps } from "./primitives/stat-card";
export { Skeleton } from "./primitives/skeleton";
export { EmptyState, type EmptyStateProps } from "./primitives/empty-state";
export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsProps } from "./primitives/tabs";
export { Modal, type ModalProps } from "./primitives/modal";
export { ToastProvider, useToast } from "./primitives/toast";
export {
  AddressInput,
  type AddressInputProps,
  type AddressSuggestion,
} from "./primitives/address-input";

// Map
export {
  PermitMap,
  type PermitMapProps,
  type PermitPin,
  type TileOverlay,
} from "./map/permit-map";

// Report
export { ProjectTypeBadge, type ProjectTypeBadgeProps } from "./report/project-type-badge";
export { ActivityBadge, type ActivityBadgeProps } from "./report/activity-badge";
export { SourceAttribution, type SourceAttributionProps } from "./report/source-attribution";
export {
  FreshnessIndicator,
  type FreshnessIndicatorProps,
} from "./report/freshness-indicator";
export {
  PermitTimeline,
  type PermitTimelineProps,
  type PermitTimelineEntry,
} from "./report/permit-timeline";
export {
  AreaActivityCard,
  type AreaActivityCardProps,
  type AreaActivityData,
  type AreaActivityPoint,
  type AreaProjectShare,
} from "./report/area-activity";
export {
  ContractorActivityList,
  type ContractorActivityListProps,
  type ContractorActivityEntry,
} from "./report/contractor-activity";
export {
  ReportLayout,
  ReportSection,
  REPORT_DISCLAIMER,
  type ReportLayoutProps,
  type ReportSectionProps,
} from "./report/report-layout";
