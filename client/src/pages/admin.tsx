import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/app-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  FileText,
  Users,
  Edit,
  Save,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Vote,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  GripVertical,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import type { BallotMeasure, Candidate } from "@shared/schema";

interface StoredBallot {
  id: string;
  state: string;
  county: string | null;
  electionDate: string;
  electionType: string;
  measures: BallotMeasure[];
  candidates: Candidate[];
}

interface ElectionEvent {
  id: string;
  state: string;
  county: string | null;
  title: string;
  eventType: string;
  electionDate: string;
  registrationDeadline: string | null;
  description: string | null;
  ballotId: string | null;
  status: "upcoming" | "current" | "passed";
  visibility: "public" | "private";
  archived: boolean;
}

interface CreateEventForm {
  state: string;
  title: string;
  eventType: string;
  electionDate: string;
  registrationDeadline: string;
  description: string;
  visibility: "public" | "private";
}

const initialEventForm: CreateEventForm = {
  state: "",
  title: "",
  eventType: "",
  electionDate: "",
  registrationDeadline: "",
  description: "",
  visibility: "private",
};

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("events");
  const [editingBallot, setEditingBallot] = useState<string | null>(null);
  const [editData, setEditData] = useState<StoredBallot | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createEventForm, setCreateEventForm] = useState<CreateEventForm>(initialEventForm);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventEditData, setEventEditData] = useState<Partial<ElectionEvent> | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [archivedSearchFilter, setArchivedSearchFilter] = useState("");
  const [archivedTypeFilter, setArchivedTypeFilter] = useState<string>("all");
  const [archivedVisibilityFilter, setArchivedVisibilityFilter] = useState<string>("all");
  const [archivedStateFilter, setArchivedStateFilter] = useState<string>("all");
  const [selectedPropTab, setSelectedPropTab] = useState<string>("");
  const [selectedPositionTab, setSelectedPositionTab] = useState<string>("");

  const { data: ballots, isLoading, refetch } = useQuery<StoredBallot[]>({
    queryKey: ["/api/admin/ballots"],
  });

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery<ElectionEvent[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: archivedEvents, isLoading: archivedEventsLoading, refetch: refetchArchivedEvents } = useQuery<ElectionEvent[]>({
    queryKey: ["/api/admin/events/archived"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: CreateEventForm) => {
      return apiRequest("POST", "/api/admin/events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setShowCreateDialog(false);
      setCreateEventForm(initialEventForm);
      toast({
        title: "Event Created",
        description: "The election event has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create the event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("DELETE", `/api/admin/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setDeleteEventId(null);
      toast({
        title: "Event Deleted",
        description: "The election event has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Partial<ElectionEvent> & { id: string }) => {
      return apiRequest("PUT", `/api/admin/events/${eventData.id}`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      setEditingEventId(null);
      setEventEditData(null);
      toast({
        title: "Event Updated",
        description: "The event has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update the event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBallotMutation = useMutation({
    mutationFn: async (ballot: StoredBallot) => {
      return apiRequest("PUT", `/api/admin/ballots/${ballot.id}`, ballot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ballots"] });
      setEditingBallot(null);
      setEditData(null);
      toast({
        title: "Ballot Updated",
        description: "The ballot data has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update the ballot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const archiveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("POST", `/api/admin/events/${eventId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events/archived"] });
      toast({
        title: "Event Archived",
        description: "The election event has been archived successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Archive Failed",
        description: "Failed to archive the event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const restoreEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("POST", `/api/admin/events/${eventId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events/archived"] });
      toast({
        title: "Event Restored",
        description: "The election event has been restored successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Restore Failed",
        description: "Failed to restore the event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const stateNames: Record<string, string> = {
    NY: "New York",
    NJ: "New Jersey",
    PA: "Pennsylvania",
    CT: "Connecticut",
    TX: "Texas",
  };

  const validateDateFormat = (dateStr: string): boolean => {
    if (!dateStr) return true;
    const datePatternSlash = /^\d{4}\/\d{2}\/\d{2}$/;
    const datePatternDash = /^\d{4}-\d{2}-\d{2}$/;
    const separator = datePatternSlash.test(dateStr) ? "/" : datePatternDash.test(dateStr) ? "-" : null;
    if (!separator) return false;
    const [year, month, day] = dateStr.split(separator).map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const handleEditEvent = (event: ElectionEvent) => {
    setEditingEventId(event.id);
    setEventEditData({ ...event });
  };

  const handleSaveEvent = () => {
    if (eventEditData && eventEditData.id) {
      if (eventEditData.electionDate && !validateDateFormat(eventEditData.electionDate)) {
        toast({
          title: "Invalid Date Format",
          description: "Election date must be in YYYY/MM/DD or YYYY-MM-DD format",
          variant: "destructive",
        });
        return;
      }
      if (eventEditData.registrationDeadline && !validateDateFormat(eventEditData.registrationDeadline)) {
        toast({
          title: "Invalid Date Format",
          description: "Registration deadline must be in YYYY/MM/DD or YYYY-MM-DD format",
          variant: "destructive",
        });
        return;
      }
      updateEventMutation.mutate(eventEditData as ElectionEvent);
    }
  };

  const handleCancelEventEdit = () => {
    setEditingEventId(null);
    setEventEditData(null);
  };

  const handleCreateEvent = () => {
    if (createEventForm.electionDate && !validateDateFormat(createEventForm.electionDate)) {
      toast({
        title: "Invalid Date Format",
        description: "Election date must be in YYYY/MM/DD or YYYY-MM-DD format",
        variant: "destructive",
      });
      return;
    }
    if (createEventForm.registrationDeadline && !validateDateFormat(createEventForm.registrationDeadline)) {
      toast({
        title: "Invalid Date Format",
        description: "Registration deadline must be in YYYY/MM/DD or YYYY-MM-DD format",
        variant: "destructive",
      });
      return;
    }
    createEventMutation.mutate({
      ...createEventForm,
      title: createEventForm.title.trim(),
      electionDate: createEventForm.electionDate.trim(),
      registrationDeadline: createEventForm.registrationDeadline.trim(),
      description: createEventForm.description.trim(),
    });
  };

  const handleEditBallot = (ballot: StoredBallot) => {
    setEditingBallot(ballot.id);
    setEditData(JSON.parse(JSON.stringify(ballot)));
    if (ballot.measures.length > 0) {
      setSelectedPropTab(ballot.measures[0].id);
    }
    const offices = Array.from(new Set(ballot.candidates.map(c => c.office)));
    if (offices.length > 0) {
      setSelectedPositionTab(offices[0]);
    }
  };

  const handleSaveBallot = () => {
    if (editData) {
      updateBallotMutation.mutate(editData);
    }
  };

  const handleCancelEdit = () => {
    setEditingBallot(null);
    setEditData(null);
  };

  const updateMeasure = (measureId: string, field: string, value: string | string[]) => {
    if (!editData) return;
    setEditData({
      ...editData,
      measures: editData.measures.map(m => {
        if (m.id !== measureId) return m;
        if (field.startsWith("summary.")) {
          const summaryField = field.replace("summary.", "");
          return {
            ...m,
            summary: { ...m.summary, [summaryField]: value }
          };
        }
        return { ...m, [field]: value };
      })
    });
  };

  const updateCandidate = (candidateId: string, field: string, value: string | string[] | number | undefined) => {
    if (!editData) return;
    setEditData({
      ...editData,
      candidates: editData.candidates.map(c => 
        c.id === candidateId ? { ...c, [field]: value } : c
      )
    });
  };

  const moveMeasure = (measureId: string, direction: "up" | "down") => {
    if (!editData) return;
    const idx = editData.measures.findIndex(m => m.id === measureId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === editData.measures.length - 1) return;
    const newMeasures = [...editData.measures];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newMeasures[idx], newMeasures[swapIdx]] = [newMeasures[swapIdx], newMeasures[idx]];
    const renumberedMeasures = newMeasures.map((m, i) => ({ ...m, number: String(i + 1) }));
    setEditData({ ...editData, measures: renumberedMeasures });
    setSelectedPropTab(measureId);
  };

  const addMeasure = () => {
    if (!editData) return;
    const newMeasure: BallotMeasure = {
      id: `measure-${Date.now()}`,
      number: `${editData.measures.length + 1}`,
      title: "New Measure",
      originalText: "",
      summary: { oneSentence: "", simple: "", detailed: "" },
      supporters: [],
      opponents: [],
    };
    setEditData({ ...editData, measures: [...editData.measures, newMeasure] });
  };

  const deleteMeasure = (measureId: string) => {
    if (!editData) return;
    const filteredMeasures = editData.measures.filter(m => m.id !== measureId);
    const renumberedMeasures = filteredMeasures.map((m, idx) => ({
      ...m,
      number: String(idx + 1)
    }));
    setEditData({ ...editData, measures: renumberedMeasures });
  };

  const moveCandidate = (candidateId: string, direction: "up" | "down") => {
    if (!editData) return;
    const idx = editData.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === editData.candidates.length - 1) return;
    const newCandidates = [...editData.candidates];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newCandidates[idx], newCandidates[swapIdx]] = [newCandidates[swapIdx], newCandidates[idx]];
    setEditData({ ...editData, candidates: newCandidates });
  };

  const addCandidate = (office: string = "New Position") => {
    if (!editData) return;
    const newCandidate: Candidate = {
      id: `candidate-${Date.now()}`,
      name: "New Candidate",
      party: "",
      office: office,
      positions: [],
      experience: "",
      endorsements: [],
    };
    setEditData({ ...editData, candidates: [...editData.candidates, newCandidate] });
  };

  const deleteCandidate = (candidateId: string) => {
    if (!editData) return;
    setEditData({ ...editData, candidates: editData.candidates.filter(c => c.id !== candidateId) });
  };

  const getUniqueOffices = (): string[] => {
    if (!editData) return [];
    const offices = Array.from(new Set(editData.candidates.map(c => c.office)));
    return offices;
  };

  const getCandidatesByOffice = (office: string): Candidate[] => {
    if (!editData) return [];
    return editData.candidates.filter(c => c.office === office);
  };

  const moveOffice = (office: string, direction: "up" | "down") => {
    if (!editData) return;
    const offices = getUniqueOffices();
    const officeIdx = offices.indexOf(office);
    if (officeIdx === -1) return;
    if (direction === "up" && officeIdx === 0) return;
    if (direction === "down" && officeIdx === offices.length - 1) return;
    const targetOffice = direction === "up" ? offices[officeIdx - 1] : offices[officeIdx + 1];
    const newCandidates = editData.candidates.map(c => {
      if (c.office === office) return { ...c, office: `__TEMP_${office}__` };
      if (c.office === targetOffice) return { ...c, office };
      return c;
    }).map(c => {
      if (c.office === `__TEMP_${office}__`) return { ...c, office: targetOffice };
      return c;
    });
    setEditData({ ...editData, candidates: newCandidates });
    setSelectedPositionTab(targetOffice);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader maxWidth="max-w-6xl" isLoading />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader maxWidth="max-w-6xl" />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 mb-6">
            <TabsList className="w-max sm:w-auto">
              <TabsTrigger value="events" className="flex items-center gap-2 whitespace-nowrap" data-testid="tab-events">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Election</span> Events
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2 whitespace-nowrap" data-testid="tab-archived">
                <Archive className="h-4 w-4" />
                Archived
              </TabsTrigger>
              <TabsTrigger value="moderation" className="flex items-center gap-2 whitespace-nowrap" data-testid="tab-moderation">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span> Review
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="ballots" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Ballot Data by State</h2>
              <Badge variant="outline">{ballots?.length || 0} states configured</Badge>
            </div>

            {ballots?.map((ballot) => (
              <Card key={ballot.id} data-testid={`ballot-card-${ballot.state}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Vote className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">
                          {stateNames[ballot.state] || ballot.state}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {ballot.county || "Statewide"} - {ballot.electionType}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingBallot === ballot.id ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleCancelEdit}
                            data-testid={`button-cancel-${ballot.state}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveBallot}
                            disabled={updateBallotMutation.isPending}
                            data-testid={`button-save-${ballot.state}`}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {updateBallotMutation.isPending ? "Saving..." : "Save All"}
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditBallot(ballot)}
                          data-testid={`button-edit-${ballot.state}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingBallot === ballot.id && editData ? (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`electionDate-${ballot.id}`}>Election Date</Label>
                          <Input
                            id={`electionDate-${ballot.id}`}
                            value={editData.electionDate}
                            onChange={(e) => setEditData({ ...editData, electionDate: e.target.value })}
                            data-testid={`input-date-${ballot.state}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`electionType-${ballot.id}`}>Election Type</Label>
                          <Input
                            id={`electionType-${ballot.id}`}
                            value={editData.electionType}
                            onChange={(e) => setEditData({ ...editData, electionType: e.target.value })}
                            data-testid={`input-type-${ballot.state}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Ballot Measures ({editData.measures.length})
                        </h4>
                        <Accordion type="multiple" className="space-y-2">
                          {editData.measures.map((measure, index) => (
                            <AccordionItem 
                              key={measure.id} 
                              value={measure.id}
                              className="border rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline" data-testid={`accordion-measure-${index}`}>
                                <div className="flex items-center gap-2 text-left">
                                  <Badge variant="secondary">{measure.number}</Badge>
                                  <span className="font-medium truncate max-w-md">{measure.title}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4 pt-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Number/Proposal ID</Label>
                                    <Input
                                      value={measure.number}
                                      onChange={(e) => updateMeasure(measure.id, "number", e.target.value)}
                                      data-testid={`input-measure-number-${index}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input
                                      value={measure.category || ""}
                                      onChange={(e) => updateMeasure(measure.id, "category", e.target.value)}
                                      placeholder="e.g., environment, economy, education"
                                      data-testid={`input-measure-category-${index}`}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Title</Label>
                                  <Input
                                    value={measure.title}
                                    onChange={(e) => updateMeasure(measure.id, "title", e.target.value)}
                                    data-testid={`input-measure-title-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Original Text</Label>
                                  <Textarea
                                    value={measure.originalText}
                                    onChange={(e) => updateMeasure(measure.id, "originalText", e.target.value)}
                                    rows={3}
                                    data-testid={`textarea-measure-original-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>One-Sentence Summary</Label>
                                  <Input
                                    value={measure.summary.oneSentence}
                                    onChange={(e) => updateMeasure(measure.id, "summary.oneSentence", e.target.value)}
                                    data-testid={`input-measure-summary-one-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Simple Summary</Label>
                                  <Textarea
                                    value={measure.summary.simple}
                                    onChange={(e) => updateMeasure(measure.id, "summary.simple", e.target.value)}
                                    rows={3}
                                    data-testid={`textarea-measure-summary-simple-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Detailed Summary</Label>
                                  <Textarea
                                    value={measure.summary.detailed}
                                    onChange={(e) => updateMeasure(measure.id, "summary.detailed", e.target.value)}
                                    rows={4}
                                    data-testid={`textarea-measure-summary-detailed-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Fiscal Impact</Label>
                                  <Textarea
                                    value={measure.fiscalImpact || ""}
                                    onChange={(e) => updateMeasure(measure.id, "fiscalImpact", e.target.value)}
                                    rows={2}
                                    placeholder="Financial impact of this measure..."
                                    data-testid={`textarea-measure-fiscal-${index}`}
                                  />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Supporters (comma-separated)</Label>
                                    <Textarea
                                      value={measure.supporters.join(", ")}
                                      onChange={(e) => updateMeasure(measure.id, "supporters", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                      rows={2}
                                      placeholder="Organization 1, Organization 2..."
                                      data-testid={`textarea-measure-supporters-${index}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Opponents (comma-separated)</Label>
                                    <Textarea
                                      value={measure.opponents.join(", ")}
                                      onChange={(e) => updateMeasure(measure.id, "opponents", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                                      rows={2}
                                      placeholder="Organization 1, Organization 2..."
                                      data-testid={`textarea-measure-opponents-${index}`}
                                    />
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Candidates ({editData.candidates.length})
                        </h4>
                        <Accordion type="multiple" className="space-y-2">
                          {editData.candidates.map((candidate, index) => (
                            <AccordionItem 
                              key={candidate.id} 
                              value={candidate.id}
                              className="border rounded-lg px-4"
                            >
                              <AccordionTrigger className="hover:no-underline" data-testid={`accordion-candidate-${index}`}>
                                <div className="flex items-center gap-2 text-left">
                                  <span className="font-medium">{candidate.name}</span>
                                  <Badge variant="outline">{candidate.party}</Badge>
                                  <span className="text-muted-foreground text-sm">- {candidate.office}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="space-y-4 pt-4">
                                <div className="grid gap-4 sm:grid-cols-3">
                                  <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                      value={candidate.name}
                                      onChange={(e) => updateCandidate(candidate.id, "name", e.target.value)}
                                      data-testid={`input-candidate-name-${index}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Party</Label>
                                    <Input
                                      value={candidate.party}
                                      onChange={(e) => updateCandidate(candidate.id, "party", e.target.value)}
                                      data-testid={`input-candidate-party-${index}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Office</Label>
                                    <Input
                                      defaultValue={candidate.office}
                                      onBlur={(e) => updateCandidate(candidate.id, "office", e.target.value)}
                                      data-testid={`input-candidate-office-${index}`}
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input
                                      type="number"
                                      value={candidate.age || ""}
                                      onChange={(e) => updateCandidate(candidate.id, "age", e.target.value ? parseInt(e.target.value) : undefined)}
                                      data-testid={`input-candidate-age-${index}`}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Photo URL</Label>
                                    <Input
                                      value={candidate.photoUrl || ""}
                                      onChange={(e) => updateCandidate(candidate.id, "photoUrl", e.target.value)}
                                      placeholder="https://..."
                                      data-testid={`input-candidate-photo-${index}`}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Experience</Label>
                                  <Textarea
                                    value={candidate.experience}
                                    onChange={(e) => updateCandidate(candidate.id, "experience", e.target.value)}
                                    rows={2}
                                    data-testid={`textarea-candidate-experience-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Positions (one per line)</Label>
                                  <Textarea
                                    value={candidate.positions.join("\n")}
                                    onChange={(e) => updateCandidate(candidate.id, "positions", e.target.value.split("\n"))}
                                    rows={4}
                                    placeholder="Position 1&#10;Position 2&#10;Position 3"
                                    data-testid={`textarea-candidate-positions-${index}`}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Endorsements (one per line)</Label>
                                  <Textarea
                                    value={candidate.endorsements.join("\n")}
                                    onChange={(e) => updateCandidate(candidate.id, "endorsements", e.target.value.split("\n"))}
                                    rows={2}
                                    placeholder="Endorsement 1&#10;Endorsement 2..."
                                    data-testid={`textarea-candidate-endorsements-${index}`}
                                  />
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Election Date: <strong className="text-foreground">{ballot.electionDate}</strong></span>
                        <span>Measures: <strong className="text-foreground">{ballot.measures.length}</strong></span>
                        <span>Candidates: <strong className="text-foreground">{ballot.candidates.length}</strong></span>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Ballot Measures
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {ballot.measures.map((measure) => (
                              <div 
                                key={measure.id} 
                                className="p-2 bg-muted rounded-lg text-sm"
                              >
                                <div className="font-medium">{measure.number}</div>
                                <div className="text-muted-foreground truncate">
                                  {measure.title}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Candidates
                          </h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {ballot.candidates.map((candidate) => (
                              <div 
                                key={candidate.id} 
                                className="p-2 bg-muted rounded-lg text-sm"
                              >
                                <div className="font-medium">{candidate.name}</div>
                                <div className="text-muted-foreground">
                                  {candidate.party} - {candidate.office}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold">Election Events & Ballot Management</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{events?.length || 0} events</Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { refetchEvents(); refetch(); }}
                  data-testid="button-refresh-events"
                  className="h-10 sm:h-9"
                >
                  <RefreshCw className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateDialog(true)}
                  data-testid="button-create-event"
                  className="h-10 sm:h-9"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Event</span>
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
                <Input
                  placeholder="Search events..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="h-10 sm:h-9"
                  data-testid="input-search-events"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-9" data-testid="select-filter-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="runoff">Runoff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 sm:h-9" data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 sm:h-9" data-testid="select-filter-visibility">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-9" data-testid="select-filter-state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="NJ">New Jersey</SelectItem>
                  <SelectItem value="PA">Pennsylvania</SelectItem>
                  <SelectItem value="CT">Connecticut</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (() => {
              const filteredEvents = (events || []).filter((event) => {
                const matchesSearch = !searchFilter || 
                  event.title.toLowerCase().includes(searchFilter.toLowerCase());
                const matchesType = typeFilter === "all" || event.eventType === typeFilter;
                const matchesStatus = statusFilter === "all" || event.status === statusFilter;
                const matchesVisibility = visibilityFilter === "all" || event.visibility === visibilityFilter;
                const matchesState = stateFilter === "all" || event.state === stateFilter;
                return matchesSearch && matchesType && matchesStatus && matchesVisibility && matchesState;
              });
              
              if (filteredEvents.length === 0 && events && events.length > 0) {
                return (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No matching events</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              
              if (!events || events.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No election events found</p>
                      <p className="text-sm text-muted-foreground">
                        Events will appear here once they are created
                      </p>
                    </CardContent>
                  </Card>
                );
              }
              
              return (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredEvents.map((event) => {
                  const ballot = ballots?.find(b => b.id === event.ballotId || (b.state === event.state && !event.county));
                  const isEditing = ballot && editingBallot === ballot.id;
                  
                  return (
                    <AccordionItem key={event.id} value={event.id} className="border rounded-lg">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid={`event-card-${event.id}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {event.electionDate}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 ml-8 sm:ml-0">
                            <Badge 
                              variant={event.visibility === "public" ? "outline" : "secondary"}
                              className="flex items-center gap-1 text-xs"
                            >
                              {event.visibility === "private" ? "Private" : "Public"}
                            </Badge>
                            <Badge 
                              variant={event.status === "upcoming" ? "default" : event.status === "current" ? "outline" : "secondary"}
                              className={`flex items-center gap-1 text-xs ${event.status === "current" ? "border-primary text-primary" : ""}`}
                            >
                              {event.status === "passed" && <History className="h-3 w-3" />}
                              {event.status === "current" && <Calendar className="h-3 w-3" />}
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveEventMutation.mutate(event.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  archiveEventMutation.mutate(event.id);
                                }
                              }}
                              data-testid={`button-archive-event-${event.id}`}
                              title="Archive event"
                            >
                              <Archive className="h-4 w-4" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 rounded-md text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEventId(event.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  setDeleteEventId(event.id);
                                }
                              }}
                              data-testid={`button-delete-event-${event.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <h4 className="font-medium text-sm">Event Details</h4>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {editingEventId === event.id ? (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={handleCancelEventEdit}
                                  data-testid={`button-cancel-event-${event.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={handleSaveEvent}
                                  disabled={updateEventMutation.isPending}
                                  data-testid={`button-save-event-${event.id}`}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                              </>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditEvent(event)}
                                data-testid={`button-edit-event-${event.id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Event
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-4">
                          
                          {editingEventId === event.id && eventEditData ? (
                            <div className="grid gap-4 pt-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">State</Label>
                                  <Select
                                    value={eventEditData.state}
                                    onValueChange={(value) => setEventEditData({ ...eventEditData, state: value })}
                                  >
                                    <SelectTrigger className="h-10 sm:h-9" data-testid={`select-event-state-${event.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NY">New York</SelectItem>
                                      <SelectItem value="NJ">New Jersey</SelectItem>
                                      <SelectItem value="PA">Pennsylvania</SelectItem>
                                      <SelectItem value="CT">Connecticut</SelectItem>
                                      <SelectItem value="TX">Texas</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Event Type</Label>
                                  <Select
                                    value={eventEditData.eventType}
                                    onValueChange={(value) => setEventEditData({ ...eventEditData, eventType: value })}
                                  >
                                    <SelectTrigger className="h-10 sm:h-9" data-testid={`select-event-type-${event.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="primary">Primary</SelectItem>
                                      <SelectItem value="general">General</SelectItem>
                                      <SelectItem value="midterm">Midterm</SelectItem>
                                      <SelectItem value="special">Special</SelectItem>
                                      <SelectItem value="runoff">Runoff</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Title</Label>
                                <Input
                                  className="h-10 sm:h-9"
                                  value={eventEditData.title || ""}
                                  onChange={(e) => setEventEditData({ ...eventEditData, title: e.target.value })}
                                  data-testid={`input-event-title-${event.id}`}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Election Date (YYYY/MM/DD)</Label>
                                  <Input
                                    className="h-10 sm:h-9"
                                    value={eventEditData.electionDate || ""}
                                    onChange={(e) => setEventEditData({ ...eventEditData, electionDate: e.target.value })}
                                    placeholder="2026/03/15"
                                    data-testid={`input-event-date-${event.id}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Registration Deadline (YYYY/MM/DD)</Label>
                                  <Input
                                    className="h-10 sm:h-9"
                                    value={eventEditData.registrationDeadline || ""}
                                    onChange={(e) => setEventEditData({ ...eventEditData, registrationDeadline: e.target.value })}
                                    placeholder="2026/03/05"
                                    data-testid={`input-event-reg-deadline-${event.id}`}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <Textarea
                                  value={eventEditData.description || ""}
                                  onChange={(e) => setEventEditData({ ...eventEditData, description: e.target.value })}
                                  rows={2}
                                  data-testid={`textarea-event-desc-${event.id}`}
                                />
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <div>
                                  <Label className="text-sm font-medium">Visibility</Label>
                                  <p className="text-xs text-muted-foreground">Private events are only visible to admins</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {eventEditData.visibility === "public" ? "Public" : "Private"}
                                  </span>
                                  <Switch
                                    checked={eventEditData.visibility === "public"}
                                    onCheckedChange={(checked) => setEventEditData({ 
                                      ...eventEditData, 
                                      visibility: checked ? "public" : "private" 
                                    })}
                                    data-testid={`switch-visibility-edit-${event.id}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-2">
                              <div>
                                <span className="text-muted-foreground">State:</span>{" "}
                                <span className="font-medium">{stateNames[event.state] || event.state}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Type:</span>{" "}
                                <span className="font-medium capitalize">{event.eventType}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Election Date:</span>{" "}
                                <span className="font-medium">{event.electionDate}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Reg. Deadline:</span>{" "}
                                <span className="font-medium">{event.registrationDeadline || "N/A"}</span>
                              </div>
                              <div className="col-span-2 flex items-center gap-3">
                                <span className="text-muted-foreground">Visibility:</span>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={event.visibility === "public"}
                                    onCheckedChange={(checked) => {
                                      updateEventMutation.mutate({
                                        ...event,
                                        visibility: checked ? "public" : "private"
                                      });
                                    }}
                                    data-testid={`switch-visibility-${event.id}`}
                                  />
                                  <span className="font-medium text-sm">{event.visibility === "public" ? "Public" : "Private"}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {ballot ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-[1fr_auto] gap-4">
                              <div className="text-sm text-muted-foreground">
                                {ballot.measures.length} measures, {ballot.candidates.length} candidates
                              </div>
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={handleCancelEdit}
                                      data-testid={`button-cancel-${event.id}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={handleSaveBallot}
                                      disabled={updateBallotMutation.isPending}
                                      data-testid={`button-save-${event.id}`}
                                    >
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditBallot(ballot)}
                                    data-testid={`button-edit-${event.id}`}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Ballot
                                  </Button>
                                )}
                              </div>
                            </div>

                            {isEditing && editData ? (
                              <div className="space-y-6 border-t pt-4">
                                {/* Propositions Section */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-base font-medium">
                                    <FileText className="h-4 w-4" />
                                    Propositions ({editData.measures.length})
                                  </div>
                                  {(() => {
                                    const activePropTab = selectedPropTab && editData.measures.find(m => m.id === selectedPropTab) 
                                      ? selectedPropTab 
                                      : editData.measures[0]?.id || "";
                                    
                                    if (editData.measures.length === 0) {
                                      return (
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                            const newId = `measure-${Date.now()}`;
                                            const newMeasure: BallotMeasure = {
                                              id: newId,
                                              number: "1",
                                              title: "New Measure",
                                              originalText: "",
                                              summary: { oneSentence: "", simple: "", detailed: "" },
                                              supporters: [],
                                              opponents: [],
                                            };
                                            setEditData({ ...editData, measures: [newMeasure] });
                                            setSelectedPropTab(newId);
                                          }}
                                          data-testid="button-add-first-measure"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add First Proposition
                                        </Button>
                                      );
                                    }
                                    
                                    return (
                                      <Tabs value={activePropTab} onValueChange={setSelectedPropTab} className="w-full">
                                        <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto">
                                          <TabsList className="h-auto p-1 bg-muted/50 flex-wrap">
                                            {editData.measures.map((measure, idx) => (
                                              <div key={measure.id} className="flex items-center">
                                                {idx > 0 && activePropTab === measure.id && (
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={(e) => { e.stopPropagation(); moveMeasure(measure.id, "up"); }}
                                                    data-testid={`button-measure-left-${idx}`}
                                                  >
                                                    <ChevronLeft className="h-3 w-3" />
                                                  </Button>
                                                )}
                                                <TabsTrigger
                                                  value={measure.id}
                                                  className="text-xs px-3 py-1.5"
                                                  data-testid={`tab-prop-${idx}`}
                                                >
                                                  Prop {idx + 1}
                                                </TabsTrigger>
                                                {idx < editData.measures.length - 1 && activePropTab === measure.id && (
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={(e) => { e.stopPropagation(); moveMeasure(measure.id, "down"); }}
                                                    data-testid={`button-measure-right-${idx}`}
                                                  >
                                                    <ChevronRight className="h-3 w-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            ))}
                                          </TabsList>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 shrink-0"
                                            onClick={() => {
                                              const newId = `measure-${Date.now()}`;
                                              const newMeasure: BallotMeasure = {
                                                id: newId,
                                                number: `${editData.measures.length + 1}`,
                                                title: "New Measure",
                                                originalText: "",
                                                summary: { oneSentence: "", simple: "", detailed: "" },
                                                supporters: [],
                                                opponents: [],
                                              };
                                              setEditData({ ...editData, measures: [...editData.measures, newMeasure] });
                                              setSelectedPropTab(newId);
                                            }}
                                            data-testid="button-add-measure"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        {editData.measures.map((measure, idx) => (
                                          <TabsContent key={measure.id} value={measure.id} className="mt-3 space-y-3">
                                            <div className="flex items-center justify-between">
                                              <Badge variant="secondary" className="font-semibold">
                                                Proposition {idx + 1}
                                              </Badge>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                  const remainingMeasures = editData.measures.filter(m => m.id !== measure.id);
                                                  const renumbered = remainingMeasures.map((m, i) => ({ ...m, number: String(i + 1) }));
                                                  setEditData({ ...editData, measures: renumbered });
                                                  if (remainingMeasures.length > 0) {
                                                    const newIdx = Math.min(idx, remainingMeasures.length - 1);
                                                    setSelectedPropTab(remainingMeasures[newIdx].id);
                                                  } else {
                                                    setSelectedPropTab("");
                                                  }
                                                }}
                                                data-testid={`button-measure-delete-${idx}`}
                                              >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Delete
                                              </Button>
                                            </div>
                                            <div className="space-y-3">
                                              <div>
                                                <Label className="text-xs text-muted-foreground">Title</Label>
                                                <Input
                                                  value={measure.title}
                                                  onChange={(e) => updateMeasure(measure.id, "title", e.target.value)}
                                                  data-testid={`input-measure-title-${idx}`}
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-xs text-muted-foreground">Simple Summary</Label>
                                                <Textarea
                                                  value={measure.summary.simple}
                                                  onChange={(e) => updateMeasure(measure.id, "summary.simple", e.target.value)}
                                                  rows={2}
                                                  data-testid={`input-measure-simple-${idx}`}
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-xs text-muted-foreground">Detailed Summary</Label>
                                                <Textarea
                                                  value={measure.summary.detailed}
                                                  onChange={(e) => updateMeasure(measure.id, "summary.detailed", e.target.value)}
                                                  rows={3}
                                                  data-testid={`input-measure-detailed-${idx}`}
                                                />
                                              </div>
                                            </div>
                                          </TabsContent>
                                        ))}
                                      </Tabs>
                                    );
                                  })()}
                                </div>

                                {/* Positions & Candidates Section */}
                                <div className="space-y-3 border-t pt-4">
                                  <div className="flex items-center gap-2 text-base font-medium">
                                    <Users className="h-4 w-4" />
                                    Positions & Candidates ({editData.candidates.length})
                                  </div>
                                  {(() => {
                                    const offices = getUniqueOffices();
                                    const activePositionTab = selectedPositionTab && offices.includes(selectedPositionTab)
                                      ? selectedPositionTab
                                      : offices[0] || "";
                                    
                                    if (offices.length === 0) {
                                      return (
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                            const newOffice = "New Position";
                                            addCandidate(newOffice);
                                            setSelectedPositionTab(newOffice);
                                          }}
                                          data-testid="button-add-first-position"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add First Position
                                        </Button>
                                      );
                                    }
                                    return (
                                      <Tabs value={activePositionTab} onValueChange={setSelectedPositionTab} className="w-full">
                                        <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto">
                                          <TabsList className="h-auto p-1 bg-muted/50 flex-wrap">
                                            {offices.map((office, officeIdx) => {
                                              const candidateCount = getCandidatesByOffice(office).length;
                                              return (
                                                <div key={office} className="flex items-center">
                                                  {officeIdx > 0 && activePositionTab === office && (
                                                    <Button
                                                      size="icon"
                                                      variant="ghost"
                                                      className="h-6 w-6 shrink-0"
                                                      onClick={(e) => { e.stopPropagation(); moveOffice(office, "up"); }}
                                                      data-testid={`button-office-left-${officeIdx}`}
                                                    >
                                                      <ChevronLeft className="h-3 w-3" />
                                                    </Button>
                                                  )}
                                                  <TabsTrigger
                                                    value={office}
                                                    className="text-xs px-3 py-1.5"
                                                    data-testid={`tab-position-${officeIdx}`}
                                                  >
                                                    {office} ({candidateCount})
                                                  </TabsTrigger>
                                                  {officeIdx < offices.length - 1 && activePositionTab === office && (
                                                    <Button
                                                      size="icon"
                                                      variant="ghost"
                                                      className="h-6 w-6 shrink-0"
                                                      onClick={(e) => { e.stopPropagation(); moveOffice(office, "down"); }}
                                                      data-testid={`button-office-right-${officeIdx}`}
                                                    >
                                                      <ChevronRight className="h-3 w-3" />
                                                    </Button>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </TabsList>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 shrink-0"
                                            onClick={() => {
                                              const newOffice = "New Position";
                                              addCandidate(newOffice);
                                              setSelectedPositionTab(newOffice);
                                            }}
                                            data-testid="button-add-position"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        {offices.map((office, officeIdx) => {
                                          const officeCandidates = getCandidatesByOffice(office);
                                          return (
                                            <TabsContent key={office} value={office} className="mt-3 space-y-3">
                                              <div className="flex items-center justify-between">
                                                <Badge variant="outline" className="font-semibold">
                                                  {office}
                                                </Badge>
                                              </div>
                                              <div className="space-y-3">
                                                {officeCandidates.map((candidate) => {
                                                  const globalIdx = editData.candidates.findIndex(c => c.id === candidate.id);
                                                  return (
                                                    <div key={candidate.id} className="bg-muted/30 rounded-lg p-3 space-y-3">
                                                      <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">{candidate.name || "Unnamed Candidate"}</span>
                                                        <div className="flex items-center gap-1">
                                                          <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => moveCandidate(candidate.id, "up")}
                                                            disabled={globalIdx === 0}
                                                            data-testid={`button-candidate-up-${globalIdx}`}
                                                          >
                                                            <ChevronUp className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => moveCandidate(candidate.id, "down")}
                                                            disabled={globalIdx === editData.candidates.length - 1}
                                                            data-testid={`button-candidate-down-${globalIdx}`}
                                                          >
                                                            <ChevronDown className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                                            onClick={() => deleteCandidate(candidate.id)}
                                                            data-testid={`button-candidate-delete-${globalIdx}`}
                                                          >
                                                            <Trash2 className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                      <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                          <Label className="text-xs text-muted-foreground">Name</Label>
                                                          <Input
                                                            value={candidate.name}
                                                            onChange={(e) => updateCandidate(candidate.id, "name", e.target.value)}
                                                            data-testid={`input-candidate-name-${globalIdx}`}
                                                          />
                                                        </div>
                                                        <div>
                                                          <Label className="text-xs text-muted-foreground">Party</Label>
                                                          <Input
                                                            value={candidate.party}
                                                            onChange={(e) => updateCandidate(candidate.id, "party", e.target.value)}
                                                            data-testid={`input-candidate-party-${globalIdx}`}
                                                          />
                                                        </div>
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs text-muted-foreground">Position/Office</Label>
                                                        <Input
                                                          defaultValue={candidate.office}
                                                          onBlur={(e) => updateCandidate(candidate.id, "office", e.target.value)}
                                                          data-testid={`input-candidate-office-${globalIdx}`}
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs text-muted-foreground">Policy Positions (one per line)</Label>
                                                        <Textarea
                                                          value={(candidate.positions || []).join("\n")}
                                                          onChange={(e) => updateCandidate(candidate.id, "positions", e.target.value.split("\n"))}
                                                          rows={2}
                                                          placeholder="Enter each position on a new line..."
                                                          data-testid={`input-candidate-positions-${globalIdx}`}
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs text-muted-foreground">Experience</Label>
                                                        <Textarea
                                                          value={candidate.experience || ""}
                                                          onChange={(e) => updateCandidate(candidate.id, "experience", e.target.value)}
                                                          rows={2}
                                                          placeholder="Previous experience and qualifications..."
                                                          data-testid={`input-candidate-experience-${globalIdx}`}
                                                        />
                                                      </div>
                                                      <div>
                                                        <Label className="text-xs text-muted-foreground">Endorsements (one per line)</Label>
                                                        <Textarea
                                                          value={(candidate.endorsements || []).join("\n")}
                                                          onChange={(e) => updateCandidate(candidate.id, "endorsements", e.target.value.split("\n"))}
                                                          rows={2}
                                                          placeholder="Enter each endorsement on a new line..."
                                                          data-testid={`input-candidate-endorsements-${globalIdx}`}
                                                        />
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="w-full"
                                                  onClick={() => addCandidate(office)}
                                                  data-testid={`button-add-candidate-${officeIdx}`}
                                                >
                                                  <Plus className="h-3 w-3 mr-1" />
                                                  Add Candidate to {office}
                                                </Button>
                                              </div>
                                            </TabsContent>
                                          );
                                        })}
                                      </Tabs>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Measures
                                  </h4>
                                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                    {ballot.measures.map((m, idx) => (
                                      <div key={m.id} className="text-muted-foreground truncate">Prop {idx + 1}: {m.title}</div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Candidates
                                  </h4>
                                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                    {(() => {
                                      const offices = Array.from(new Set(ballot.candidates.map(c => c.office)));
                                      return offices.map((office) => (
                                        <div key={office}>
                                          <div className="font-medium text-muted-foreground">{office}</div>
                                          <div className="pl-4 mt-1 space-y-0.5">
                                            {ballot.candidates
                                              .filter(c => c.office === office)
                                              .map(c => (
                                                <div key={c.id} className="text-muted-foreground truncate">- {c.name} ({c.party})</div>
                                              ))}
                                          </div>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <Vote className="h-8 w-8 mx-auto mb-2" />
                            <p>No ballot data available for this event</p>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
              );
            })()}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4">
            {/* Filter Controls for Archived Events */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
                <Input
                  placeholder="Search archived events..."
                  value={archivedSearchFilter}
                  onChange={(e) => setArchivedSearchFilter(e.target.value)}
                  className="h-10 sm:h-9"
                  data-testid="input-search-archived-events"
                />
              </div>
              <Select value={archivedTypeFilter} onValueChange={setArchivedTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-9" data-testid="select-archived-filter-type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="runoff">Runoff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={archivedVisibilityFilter} onValueChange={setArchivedVisibilityFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 sm:h-9" data-testid="select-archived-filter-visibility">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Select value={archivedStateFilter} onValueChange={setArchivedStateFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-9" data-testid="select-archived-filter-state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="NJ">New Jersey</SelectItem>
                  <SelectItem value="PA">Pennsylvania</SelectItem>
                  <SelectItem value="CT">Connecticut</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {archivedEventsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !archivedEvents || archivedEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Archived Events</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Archived events will appear here. You can archive old events from the Election Events tab to keep them for record.
                  </p>
                </CardContent>
              </Card>
            ) : (() => {
              const filteredArchivedEvents = archivedEvents.filter((event) => {
                const matchesSearch = !archivedSearchFilter || 
                  event.title.toLowerCase().includes(archivedSearchFilter.toLowerCase());
                const matchesType = archivedTypeFilter === "all" || event.eventType === archivedTypeFilter;
                const matchesVisibility = archivedVisibilityFilter === "all" || event.visibility === archivedVisibilityFilter;
                const matchesState = archivedStateFilter === "all" || event.state === archivedStateFilter;
                return matchesSearch && matchesType && matchesVisibility && matchesState;
              });

              if (filteredArchivedEvents.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">No matching archived events</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredArchivedEvents.map((event) => {
                  const ballot = ballots?.find(b => b.id === event.ballotId || (b.state === event.state && !event.county));
                  
                  return (
                    <AccordionItem key={event.id} value={event.id} className="border rounded-lg">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid={`archived-event-card-${event.id}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-4 gap-2">
                          <div className="flex items-center gap-3">
                            <Archive className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="text-left min-w-0">
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {event.electionDate}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 ml-8 sm:ml-0">
                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                              {stateNames[event.state] || event.state}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Archive className="h-3 w-3" />
                              Archived
                            </Badge>
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 rounded-md text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreEventMutation.mutate(event.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  restoreEventMutation.mutate(event.id);
                                }
                              }}
                              data-testid={`button-restore-event-${event.id}`}
                              title="Restore event"
                            >
                              <ArchiveRestore className="h-4 w-4" />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              className="inline-flex items-center justify-center h-10 w-10 sm:h-8 sm:w-8 rounded-md text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteEventId(event.id);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.stopPropagation();
                                  setDeleteEventId(event.id);
                                }
                              }}
                              data-testid={`button-delete-archived-event-${event.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium">State:</span>
                              <span className="ml-2 text-muted-foreground">{stateNames[event.state] || event.state}</span>
                            </div>
                            <div>
                              <span className="font-medium">Type:</span>
                              <span className="ml-2 text-muted-foreground capitalize">{event.eventType}</span>
                            </div>
                            <div>
                              <span className="font-medium">Date:</span>
                              <span className="ml-2 text-muted-foreground">{event.electionDate}</span>
                            </div>
                            {event.registrationDeadline && (
                              <div>
                                <span className="font-medium">Registration:</span>
                                <span className="ml-2 text-muted-foreground">{event.registrationDeadline}</span>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <div>
                              <span className="font-medium text-sm">Description:</span>
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            </div>
                          )}
                          {ballot && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t pt-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Measures
                                </h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                  {ballot.measures.map((m, idx) => (
                                    <div key={m.id} className="text-muted-foreground truncate">Prop {idx + 1}: {m.title}</div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Candidates
                                </h4>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                  {(() => {
                                    const offices = Array.from(new Set(ballot.candidates.map(c => c.office)));
                                    return offices.map((office) => (
                                      <div key={office}>
                                        <div className="font-medium text-muted-foreground">{office}</div>
                                        <div className="pl-4 mt-1 space-y-0.5">
                                          {ballot.candidates
                                            .filter(c => c.office === office)
                                            .map(c => (
                                              <div key={c.id} className="text-muted-foreground truncate">- {c.name} ({c.party})</div>
                                            ))}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              );
            })()}
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Content Review Queue
                </CardTitle>
                <CardDescription>
                  Review AI-generated summaries for bias and accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mx-auto mb-4 text-success" />
                    <p className="text-lg font-medium">No items pending review</p>
                    <p className="text-sm">
                      All AI-generated content has been reviewed and approved
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bias Check Tool</CardTitle>
                <CardDescription>
                  Test content for potential bias before publishing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BiasChecker />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Election Event</DialogTitle>
            <DialogDescription>
              Add a new election event to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-state">State</Label>
              <Select
                value={createEventForm.state}
                onValueChange={(value) => setCreateEventForm({ ...createEventForm, state: value })}
              >
                <SelectTrigger id="event-state" data-testid="select-event-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="NJ">New Jersey</SelectItem>
                  <SelectItem value="PA">Pennsylvania</SelectItem>
                  <SelectItem value="CT">Connecticut</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={createEventForm.title}
                onChange={(e) => setCreateEventForm({ ...createEventForm, title: e.target.value })}
                placeholder="e.g., New York Primary Election"
                data-testid="input-event-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select
                value={createEventForm.eventType}
                onValueChange={(value) => setCreateEventForm({ ...createEventForm, eventType: value })}
              >
                <SelectTrigger id="event-type" data-testid="select-event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="runoff">Runoff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Election Date</Label>
              <Input
                id="event-date"
                value={createEventForm.electionDate}
                onChange={(e) => setCreateEventForm({ ...createEventForm, electionDate: e.target.value })}
                placeholder="e.g., June 23, 2026"
                data-testid="input-event-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-reg-deadline">Registration Deadline (optional)</Label>
              <Input
                id="event-reg-deadline"
                value={createEventForm.registrationDeadline}
                onChange={(e) => setCreateEventForm({ ...createEventForm, registrationDeadline: e.target.value })}
                placeholder="e.g., June 13, 2026"
                data-testid="input-event-reg-deadline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description (optional)</Label>
              <Textarea
                id="event-description"
                value={createEventForm.description}
                onChange={(e) => setCreateEventForm({ ...createEventForm, description: e.target.value })}
                placeholder="Brief description of the election..."
                rows={2}
                data-testid="textarea-event-description"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="event-visibility" className="text-sm font-medium">Visibility</Label>
                <p className="text-xs text-muted-foreground">Private events are only visible to admins</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {createEventForm.visibility === "public" ? "Public" : "Private"}
                </span>
                <Switch
                  id="event-visibility"
                  checked={createEventForm.visibility === "public"}
                  onCheckedChange={(checked) => setCreateEventForm({ 
                    ...createEventForm, 
                    visibility: checked ? "public" : "private" 
                  })}
                  data-testid="switch-event-visibility"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setCreateEventForm(initialEventForm);
              }}
              data-testid="button-cancel-create"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEvent}
              disabled={
                !createEventForm.state || 
                !createEventForm.title.trim() || 
                !createEventForm.electionDate.trim() || 
                createEventMutation.isPending
              }
              data-testid="button-confirm-create"
              className="w-full sm:w-auto"
            >
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation */}
      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Election Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this election event? This action cannot be undone.
              Related subscriptions and notifications will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel data-testid="button-cancel-delete" className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEventId && deleteEventMutation.mutate(deleteEventId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              data-testid="button-confirm-delete"
            >
              {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BiasChecker() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<{ biasScore: number; issues: string[] } | null>(null);
  const { toast } = useToast();

  const checkBiasMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/check-bias", {
        content: text,
        contentType: "summary",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: () => {
      toast({
        title: "Check Failed",
        description: "Failed to analyze content. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bias-content">Content to Check</Label>
        <Textarea
          id="bias-content"
          placeholder="Paste ballot measure summary or description here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          data-testid="textarea-bias-content"
        />
      </div>

      <Button
        onClick={() => checkBiasMutation.mutate(content)}
        disabled={!content.trim() || checkBiasMutation.isPending}
        data-testid="button-check-bias"
      >
        {checkBiasMutation.isPending ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          "Check for Bias"
        )}
      </Button>

      {result && (
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Bias Score</span>
            <Badge 
              className={
                result.biasScore < 3 
                  ? "bg-success text-success-foreground" 
                  : result.biasScore < 6 
                    ? "bg-warning text-warning-foreground"
                    : "bg-destructive text-destructive-foreground"
              }
            >
              {result.biasScore}/10
            </Badge>
          </div>
          {result.issues.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Issues Found:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.issues.length === 0 && result.biasScore < 3 && (
            <p className="text-sm text-success flex items-center gap-2">
              <Check className="h-4 w-4" />
              Content appears neutral and unbiased
            </p>
          )}
        </div>
      )}
    </div>
  );
}
