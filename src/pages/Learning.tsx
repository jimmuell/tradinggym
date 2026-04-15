import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle, FileText, Clock, CheckCircle2, Lock, ChevronRight } from "lucide-react";

const courses = [
  {
    id: 1, title: "Market Structure Basics", category: "Fundamentals", lessons: 8, completed: 8,
    description: "Understanding support, resistance, and price action fundamentals.",
    duration: "2h 15m", status: "completed" as const,
  },
  {
    id: 2, title: "Order Flow & Volume Analysis", category: "Intermediate", lessons: 12, completed: 5,
    description: "Reading the tape, volume profile, and order flow dynamics.",
    duration: "4h 30m", status: "in-progress" as const,
  },
  {
    id: 3, title: "Risk Management Mastery", category: "Fundamentals", lessons: 6, completed: 0,
    description: "Position sizing, drawdown management, and risk-reward optimization.",
    duration: "1h 45m", status: "locked" as const,
  },
  {
    id: 4, title: "Advanced Price Action", category: "Advanced", lessons: 15, completed: 0,
    description: "Complex patterns, multi-timeframe analysis, and confluence trading.",
    duration: "5h 20m", status: "locked" as const,
  },
];

const articles = [
  { title: "The Psychology of Losing Streaks", category: "Psychology", readTime: "5 min" },
  { title: "How to Build a Trading Plan", category: "Strategy", readTime: "8 min" },
  { title: "Understanding MES Contract Specs", category: "Fundamentals", readTime: "4 min" },
  { title: "Journaling for Consistent Profits", category: "Habits", readTime: "6 min" },
];

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (status === "in-progress") return <PlayCircle className="h-5 w-5 text-primary" />;
  return <Lock className="h-5 w-5 text-muted-foreground" />;
}

export default function Learning() {
  const totalLessons = courses.reduce((a, c) => a + c.lessons, 0);
  const completedLessons = courses.reduce((a, c) => a + c.completed, 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Learning Center</h1>
        <p className="text-muted-foreground">Master the fundamentals and sharpen your edge.</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{overallProgress}% complete</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id} className={course.status === "locked" ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <StatusIcon status={course.status} />
                    <div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={course.status === "completed" ? "default" : "secondary"}>
                    {course.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.lessons} lessons</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration}</span>
                  </div>
                  {course.status !== "locked" && (
                    <div className="flex items-center gap-3">
                      <Progress value={(course.completed / course.lessons) * 100} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground">{course.completed}/{course.lessons}</span>
                      <Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="articles" className="space-y-3">
          {articles.map((article, i) => (
            <Card key={i} className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.readTime} read</p>
                  </div>
                </div>
                <Badge variant="outline">{article.category}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
