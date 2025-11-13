import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Sparkles, RotateCw, Clock, BarChart3, Pencil, Trash2 } from "lucide-react";
import type { Question, Activity } from "@shared/schema";
import { QuestionImportButton } from "@/components/QuestionImportModal";
import { useTestSets } from "@/features/test-sets/hooks/useTestSets";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { useTemplates } from "@/features/templates/hooks/useTemplates";

type OverviewPageProps = {
  onShowTemplates: () => void;
};

export default function OverviewPage({ onShowTemplates }: OverviewPageProps) {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/stats"],
  });
  const { testSets } = useTestSets();
  const { questionsResponse, questions } = useQuestions();
  const questionItems = useMemo(() => questions, [questions]);

  const kpiData = [
    {
      label: "Total test sets",
      value: stats?.setsCount || 0,
      sublabel: "Ready to assign",
      testId: "kpi-sets",
    },
    {
      label: "Question bank items",
      value: stats?.questionsCount ?? questionsResponse?.total ?? questionItems.length ?? 0,
      sublabel: "Curated questions",
      testId: "kpi-questions",
    },
  ];
  const recentSets = useMemo(() => (testSets ? testSets.slice(0, 4) : []), [testSets]);
  const recentQuestions = useMemo(() => questionItems.slice(0, 5), [questionItems]);
  const { templates } = useTemplates();
  const featuredTemplates = useMemo(() => templates.slice(0, 4), [templates]);

  const formatQuestionType = (type: Question["type"]) => {
    switch (type) {
      case "mcq_single":
        return "MCQ (single answer)";
      case "mcq_multi":
        return "MCQ (multiple answers)";
      case "fill_blank":
        return "Fill in the blanks";
      case "writing_prompt":
        return "Writing prompt";
      case "speaking_prompt":
        return "Speaking prompt";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8 animate-slideIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment content</h1>
        <p className="text-gray-600">
          Monitor your test sets and question bank in one place to keep exam materials aligned.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {kpiData.map((kpi) => (
          <Card
            key={kpi.testId}
            data-testid={kpi.testId}
            className="relative overflow-hidden hover:-translate-y-1 transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
            <div className="p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">{kpi.label}</div>
              <div className="text-4xl font-bold text-primary my-3">{kpi.value}</div>
              <div className="text-xs text-gray-500">{kpi.sublabel}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button data-testid="button-create-set" className="gap-2">
            <Plus className="w-4 h-4" />
            Create new test set
          </Button>
          <Button variant="secondary" data-testid="button-create-question" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Add question
          </Button>
          <div>
            <QuestionImportButton />
          </div>
        </div>
      </Card>

      {featuredTemplates.length > 0 && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Template quick list</p>
              <p className="text-xs text-gray-500">Review popular templates before creating a new question.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onShowTemplates}>
              <Sparkles className="w-4 h-4 mr-1" />
              Open template studio
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {featuredTemplates.map((template) => (
              <div key={`featured-${template.id}`} className="rounded-xl border bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                <p className="text-xs text-gray-500">{template.description}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-gray-400">
                  {template.skills.map((skill) => (
                    <span key={`${template.id}-${skill}`} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Latest test sets</h3>
              <p className="text-sm text-gray-500 mt-1">Recently updated collections</p>
            </div>
          </div>
          {recentSets.length === 0 ? (
            <div className="text-sm text-gray-500">No test sets yet. Create one to get started.</div>
          ) : (
            <ul className="space-y-4">
              {recentSets.map((set) => (
                <li key={set.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{set.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {set.skill} · Updated {new Date(set.updatedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <Badge variant={set.status === "published" ? "default" : "secondary"}>
                    {set.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent question bank entries</h3>
              <p className="text-sm text-gray-500 mt-1">Fresh content across skills</p>
            </div>
          </div>
          {recentQuestions.length === 0 ? (
            <div className="text-sm text-gray-500">No questions found. Add a question to populate the bank.</div>
          ) : (
            <ul className="space-y-4">
              {recentQuestions.map((question) => (
                <li key={question.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{question.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {question.skill} · {formatQuestionType(question.type)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {question.points} pts
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent activity</h3>
              <p className="text-sm text-gray-500 mt-1">Latest changes across sets and questions</p>
            </div>
            <Button variant="secondary" size="icon" data-testid="button-refresh-activity">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
          <ActivityFeed />
        </Card>

        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Question distribution by skill</h3>
            <p className="text-sm text-gray-500 mt-1">Track balance across the bank</p>
          </div>
          <SkillDistributionChart />
        </Card>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="activity-feed">
      {activities.slice(0, 5).map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
              activity.action === "created"
                ? "bg-success/10 text-success"
                : activity.action === "updated"
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
            }`}
          >
            {activity.action === "created" ? (
              <Plus className="w-4 h-4" />
            ) : activity.action === "updated" ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.resourceTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {(activity.action === "created" ? "Created" : activity.action === "updated" ? "Updated" : "Deleted") +
                " · " +
                new Date(activity.timestamp).toLocaleTimeString("vi-VN")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillDistributionChart() {
  const { data: distribution } = useQuery<any>({
    queryKey: ["/api/questions/distribution"],
  });

  const skills = [
    { name: "Reading", count: distribution?.reading || 0, color: "bg-blue-500" },
    { name: "Listening", count: distribution?.listening || 0, color: "bg-cyan-500" },
    { name: "Speaking", count: distribution?.speaking || 0, color: "bg-green-500" },
    { name: "Writing", count: distribution?.writing || 0, color: "bg-orange-500" },
  ];

  const total = skills.reduce((sum, skill) => sum + skill.count, 0);

  if (total === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BarChart3 className="w-10 h-10 mx-auto mb-3" />
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="skill-chart">
      {skills.map((skill) => (
        <div key={skill.name}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">{skill.name}</span>
            <span className="text-gray-500">{skill.count} questions</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${skill.color} transition-all duration-500`}
              style={{ width: `${total > 0 ? (skill.count / total) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}
