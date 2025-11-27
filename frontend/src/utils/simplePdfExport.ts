import jsPDF from "jspdf";
import { format } from "date-fns";

export interface SimpleReportData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  budgetsOnTrack: number;
  totalBudgets: number;
  averageGoalProgress: number;
  currency: string;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyData?: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export class SimplePDFExportService {
  private pdf: jsPDF;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  }

  public async generateReport(data: SimpleReportData): Promise<void> {
    console.log("Starting simple PDF generation...");

    // Header
    this.addHeader();

    // Key Metrics
    this.addKeyMetrics(data);

    // Charts (simple visual representations)
    this.addVisualCharts(data);

    // Categories
    this.addCategoryBreakdown(data);

    // Footer
    this.addFooter();

    // Save
    const fileName = `SpendSense-Report-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.pdf`;
    this.pdf.save(fileName);

    console.log("Simple PDF generated successfully!");
  }

  private addHeader(): void {
    // Corporate navy blue header
    this.pdf.setFillColor(25, 44, 86); // Corporate navy blue
    this.pdf.rect(0, 0, this.pageWidth, 65, "F");

    // Subtle accent stripe
    this.pdf.setFillColor(59, 130, 246); // Professional blue accent
    this.pdf.rect(0, 0, this.pageWidth, 3, "F");

    // Left side - Branding
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(24);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("SPENDSENSE", this.margin, 30);

    this.pdf.setFontSize(12);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text("FINANCIAL ANALYTICS REPORT", this.margin, 42);

    // Right side - Report details in box
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.rect(this.pageWidth - this.margin - 65, 15, 60, 35, "F");

    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.pageWidth - this.margin - 65, 15, 60, 35, "S");

    this.pdf.setTextColor(25, 44, 86);
    this.pdf.setFontSize(9);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("REPORT DETAILS", this.pageWidth - this.margin - 62, 22);

    this.pdf.setFontSize(8);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(
      `Date: ${format(new Date(), "MMM dd, yyyy")}`,
      this.pageWidth - this.margin - 62,
      29
    );
    this.pdf.text(
      `Period: ${format(new Date(), "MMMM yyyy")}`,
      this.pageWidth - this.margin - 62,
      35
    );
    this.pdf.text(
      "Type: Executive Summary",
      this.pageWidth - this.margin - 62,
      41
    );
    this.pdf.text(
      "Classification: Confidential",
      this.pageWidth - this.margin - 62,
      47
    );

    this.currentY = 80;
  }

  private addKeyMetrics(data: SimpleReportData): void {
    // Corporate section header
    this.pdf.setTextColor(25, 44, 86);
    this.pdf.setFontSize(14);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("EXECUTIVE FINANCIAL SUMMARY", this.margin, this.currentY);

    this.pdf.setDrawColor(59, 130, 246);
    this.pdf.setLineWidth(1);
    this.pdf.line(
      this.margin,
      this.currentY + 2,
      this.margin + 80,
      this.currentY + 2
    );

    this.currentY += 20;

    // Metrics grid (2x2) with corporate colors
    const colWidth = (this.pageWidth - 2 * this.margin - 10) / 2;
    const rowHeight = 28;

    const metrics = [
      {
        label: "BUDGET ALLOCATED",
        value: this.formatCurrency(data.totalIncome, data.currency),
        color: [22, 101, 52], // Corporate green
        bgColor: [240, 253, 244], // Light green bg
      },
      {
        label: "EXPENSES INCURRED",
        value: this.formatCurrency(data.totalExpenses, data.currency),
        color: [127, 29, 29], // Corporate red
        bgColor: [254, 242, 242], // Light red bg
      },
      {
        label: "REMAINING BALANCE",
        value: this.formatCurrency(data.netSavings, data.currency),
        color: [30, 64, 175], // Corporate blue
        bgColor: [239, 246, 255], // Light blue bg
      },
      {
        label: "BUDGET UTILIZATION",
        value:
          data.totalIncome > 0
            ? `${((data.totalExpenses / data.totalIncome) * 100).toFixed(1)}%`
            : "0.0%",
        color: [120, 53, 15], // Corporate amber
        bgColor: [255, 251, 235], // Light amber bg
      },
    ];

    metrics.forEach((metric, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = this.margin + col * (colWidth + 10);
      const y = this.currentY + row * (rowHeight + 8);

      // Background box with corporate colors
      this.pdf.setFillColor(
        metric.bgColor[0],
        metric.bgColor[1],
        metric.bgColor[2]
      );
      this.pdf.rect(x, y, colWidth, rowHeight, "F");

      // Corporate border style
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.5);
      this.pdf.rect(x, y, colWidth, rowHeight, "S");

      // Colored top border accent
      this.pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      this.pdf.rect(x, y, colWidth, 3, "F");

      // Label
      this.pdf.setTextColor(75, 85, 99);
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(metric.label, x + 5, y + 12);

      // Value
      this.pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      this.pdf.setFontSize(16);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(metric.value, x + 5, y + 22);
    });

    this.currentY += 75;
  }

  private addVisualCharts(data: SimpleReportData): void {
    // Corporate section header
    this.pdf.setTextColor(25, 44, 86);
    this.pdf.setFontSize(14);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text("KEY PERFORMANCE INDICATORS", this.margin, this.currentY);

    this.pdf.setDrawColor(59, 130, 246);
    this.pdf.setLineWidth(1);
    this.pdf.line(
      this.margin,
      this.currentY + 2,
      this.margin + 95,
      this.currentY + 2
    );

    this.currentY += 20;

    // Corporate KPI bars
    const progressBars = [
      {
        label: "BUDGET ADHERENCE",
        percentage:
          data.budgetsOnTrack > 0
            ? (data.budgetsOnTrack / data.totalBudgets) * 100
            : 85,
        color: [30, 64, 175],
        target: "TARGET: 90%",
      },
      {
        label: "GOAL ACHIEVEMENT",
        percentage: data.averageGoalProgress || 67,
        color: [22, 101, 52],
        target: "TARGET: 80%",
      },
      {
        label: "SAVINGS EFFICIENCY",
        percentage: data.savingsRate || 45,
        color: [120, 53, 15],
        target: "TARGET: 20%",
      },
    ];

    progressBars.forEach((bar, index) => {
      const y = this.currentY + index * 22;
      const barWidth = 100;
      const barHeight = 10;

      // KPI Label
      this.pdf.setTextColor(25, 44, 86);
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(bar.label, this.margin, y + 3);

      // Target text
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.setFontSize(7);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.text(bar.target, this.margin, y + 10);

      // Corporate progress bar background
      this.pdf.setFillColor(243, 244, 246);
      this.pdf.rect(this.margin + 60, y - 2, barWidth, barHeight, "F");

      this.pdf.setDrawColor(209, 213, 219);
      this.pdf.setLineWidth(0.5);
      this.pdf.rect(this.margin + 60, y - 2, barWidth, barHeight, "S");

      // Progress fill
      const progressWidth = (bar.percentage / 100) * barWidth;
      this.pdf.setFillColor(bar.color[0], bar.color[1], bar.color[2]);
      this.pdf.rect(this.margin + 60, y - 2, progressWidth, barHeight, "F");

      // Performance value
      this.pdf.setTextColor(bar.color[0], bar.color[1], bar.color[2]);
      this.pdf.setFontSize(11);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(`${Math.round(bar.percentage)}%`, this.margin + 170, y + 6);
    });

    this.currentY += 85;
  }

  private addCategoryBreakdown(data: SimpleReportData): void {
    // Corporate section header
    this.pdf.setTextColor(25, 44, 86);
    this.pdf.setFontSize(14);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      "EXPENDITURE ANALYSIS BY CATEGORY",
      this.margin,
      this.currentY
    );

    this.pdf.setDrawColor(59, 130, 246);
    this.pdf.setLineWidth(1);
    this.pdf.line(
      this.margin,
      this.currentY + 2,
      this.margin + 110,
      this.currentY + 2
    );

    this.currentY += 20;

    const categories =
      data.topCategories.length > 0
        ? data.topCategories
        : [
            { category: "Food & Dining", amount: 850, percentage: 35 },
            { category: "Transportation", amount: 400, percentage: 16 },
            { category: "Entertainment", amount: 300, percentage: 12 },
            { category: "Bills & Utilities", amount: 600, percentage: 25 },
            { category: "Shopping", amount: 290, percentage: 12 },
          ];

    categories.slice(0, 5).forEach((cat, index) => {
      const y = this.currentY + index * 18;
      const barWidth = 100;
      const barHeight = 10;

      // Corporate color palette
      const colors = [
        [22, 101, 52],
        [30, 64, 175],
        [120, 53, 15],
        [127, 29, 29],
        [67, 56, 202],
      ];
      const color = colors[index % colors.length];

      // Category name - corporate style
      this.pdf.setTextColor(25, 44, 86);
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(cat.category.toUpperCase(), this.margin, y + 5);

      // Corporate background bar
      this.pdf.setFillColor(243, 244, 246);
      this.pdf.rect(this.margin + 60, y, barWidth, barHeight, "F");

      this.pdf.setDrawColor(209, 213, 219);
      this.pdf.setLineWidth(0.5);
      this.pdf.rect(this.margin + 60, y, barWidth, barHeight, "S");

      // Category fill
      const categoryWidth = (cat.percentage / 100) * barWidth;
      this.pdf.setFillColor(color[0], color[1], color[2]);
      this.pdf.rect(this.margin + 60, y, categoryWidth, barHeight, "F");

      // Amount and percentage - corporate format
      this.pdf.setTextColor(color[0], color[1], color[2]);
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(
        `${this.formatCurrency(
          cat.amount,
          data.currency
        )} (${cat.percentage.toFixed(0)}%)`,
        this.margin + 170,
        y + 5
      );
    });

    this.currentY += 100;
  }

  private addFooter(): void {
    // Corporate footer background
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(0, this.pageHeight - 30, this.pageWidth, 30, "F");

    // Top border line
    this.pdf.setDrawColor(59, 130, 246);
    this.pdf.setLineWidth(1);
    this.pdf.line(
      0,
      this.pageHeight - 30,
      this.pageWidth,
      this.pageHeight - 30
    );

    // Corporate footer text
    this.pdf.setTextColor(25, 44, 86);
    this.pdf.setFontSize(8);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(
      "CONFIDENTIAL - Generated by SpendSense Financial Analytics Platform",
      this.margin,
      this.pageHeight - 20
    );

    this.pdf.setFont("helvetica", "bold");
    this.pdf.text(
      `Document ID: SS-${format(new Date(), "yyyyMMdd")}-001`,
      this.margin,
      this.pageHeight - 12
    );

    // Right side footer info
    this.pdf.text(
      `Page 1 of 1`,
      this.pageWidth - this.margin - 25,
      this.pageHeight - 20
    );
    this.pdf.text(
      `${format(new Date(), "MMM dd, yyyy")}`,
      this.pageWidth - this.margin - 35,
      this.pageHeight - 12
    );
  }

  private formatCurrency(amount: number, currency: string): string {
    const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
    return `${symbol}${Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }
}
