# 💰 Savings Goals Module

## Overview

The Savings Goals module allows users to set, track, and manage their financial savings goals with target amounts and deadlines. It includes automatic progress tracking, status updates, and comprehensive analytics.

## Features

### Core Functionality

- ✅ Create savings goals with target amounts and deadlines
- ✅ Track progress toward each goal with percentage completed
- ✅ Add money to goals
- ✅ Withdraw money from goals
- ✅ Edit goal details (amount, date, priority, etc.)
- ✅ Delete goals
- ✅ View detailed goal information

### Smart Features

- 📊 Automatic progress percentage calculation
- ⏰ Time left calculation (days/months)
- 🎯 Automatic status updates:
  - **Active**: Goal is created and in progress
  - **On Track**: Progress is meeting or exceeding expected timeline
  - **Behind**: Progress is lagging behind expected timeline
  - **Completed**: Target amount reached
  - **Overdue**: Past target date without completion
- 💡 Monthly target tracking
- 🔔 Auto-save option (UI integration)

### Analytics

- Total target across all goals
- Total saved amount
- Overall progress percentage
- Completed goals count
- Active goals count
- Monthly savings target

## Entity Structure

### SavingsGoal Entity

```typescript
{
  id: string;                    // UUID
  name: string;                  // Goal name
  description: string | null;    // Optional description
  target_amount: string;         // Target amount (decimal)
  current_amount: string;        // Current saved amount (decimal)
  target_date: string;           // Target completion date
  category_id: string;           // Foreign key to categories
  priority: enum;                // high, medium, low
  monthly_target: string | null; // Optional monthly saving target
  auto_save: boolean;            // Auto-save feature flag
  status: enum;                  // active, completed, on_track, behind, overdue
  user_id: string;               // Foreign key to users
  created_at: Date;              // Timestamp
  updated_at: Date;              // Timestamp
}
```

### Enums

- **Priority**: `high`, `medium`, `low`
- **Status**: `active`, `completed`, `on_track`, `behind`, `overdue`

## API Endpoints

### 1. Create Savings Goal

**POST** `/savings-goals`

**Request Body:**

```json
{
  "name": "Emergency Fund",
  "description": "6 months of living expenses",
  "target_amount": 15000,
  "current_amount": 5000,
  "target_date": "2025-12-31",
  "category_id": "uuid",
  "priority": "high",
  "monthly_target": 1250
}
```

**Response:**

```json
{
  "msg": "Savings goal created successfully",
  "goal": { ... }
}
```

### 2. Get All Savings Goals

**GET** `/savings-goals`

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Emergency Fund",
    "target_amount": "15000.00",
    "current_amount": "5000.00",
    "progress_percentage": "33.33",
    "amount_remaining": "10000.00",
    "days_left": 365,
    "months_left": 12,
    "time_left_display": "12 months",
    "calculated_status": "on_track",
    "is_completed": false,
    "is_overdue": false,
    ...
  }
]
```

### 3. Get Savings Goal by ID

**GET** `/savings-goals/:id`

**Response:** Single goal object with progress calculations

### 4. Update Savings Goal

**PATCH** `/savings-goals/:id`

**Request Body:**

```json
{
  "target_amount": 18000,
  "target_date": "2025-06-30",
  "priority": "high"
}
```

**Response:**

```json
{
  "msg": "Savings goal updated successfully",
  "goal": { ... }
}
```

### 5. Add Money to Goal

**PATCH** `/savings-goals/:id/add`

**Request Body:**

```json
{
  "amount": 500
}
```

**Response:**

```json
{
  "msg": "Amount added successfully",
  "goal": { ... }
}
```

### 6. Withdraw Money from Goal

**PATCH** `/savings-goals/:id/withdraw`

**Request Body:**

```json
{
  "amount": 200
}
```

**Response:**

```json
{
  "msg": "Amount withdrawn successfully",
  "goal": { ... }
}
```

### 7. Delete Savings Goal

**DELETE** `/savings-goals/:id`

**Response:**

```json
{
  "msg": "Savings goal deleted successfully"
}
```

### 8. Get Summary/Statistics

**GET** `/savings-goals/summary`

**Response:**

```json
{
  "total_target": "72500.00",
  "total_saved": "26550.00",
  "progress_percentage": "36.62",
  "completed_goals": 0,
  "active_goals": 4,
  "total_goals": 4,
  "monthly_target": "3750.00"
}
```

### 9. Filter by Status

**GET** `/savings-goals/status/:status`

Parameters: `all`, `active`, `completed`, `on_track`, `behind`, `overdue`

### 10. Filter by Priority

**GET** `/savings-goals/priority/:priority`

Parameters: `high`, `medium`, `low`

## Progress Calculation Logic

### Progress Percentage

```
progress = (current_amount / target_amount) * 100
```

### Time Left Calculation

```
days_left = target_date - today
months_left = ceil(days_left / 30)
```

### Status Auto-Update Logic

1. **Overdue**: `days_left < 0 AND progress < 100%`
2. **Completed**: `progress >= 100%`
3. **On Track**: `actual_progress >= (expected_progress - 10%)`
4. **Behind**: `actual_progress < (expected_progress - 10%)`
5. **Active**: Default status for new goals

### Expected Progress Calculation

```
total_days = target_date - created_at
days_passed = today - created_at
expected_progress = (days_passed / total_days) * 100
```

## UI Integration Examples

### Dashboard Cards

```typescript
// Total Target
$72,500
Across 4 goals

// Total Saved
$26,550
36.6% of total target

// Completed
0
Goals achieved

// Monthly Target
$3,750
To stay on track
```

### Goal Card

```typescript
{
  name: "Emergency Fund",
  badge: "Overdue" | "Auto-save",
  description: "6 months of living expenses",
  progress: "58.3%",
  current: "$8,750",
  target: "$15,000",
  timeLeft: "Overdue" | "45 days",
  monthlyNeed: "$1,250",
  category: "Emergency"
}
```

### Filter Tabs

- **All** - Show all goals
- **Active** - Goals in progress
- **Completed** - Achieved goals
- **Behind** - Goals falling behind schedule

### Goal Statistics

- Completed: 0
- On Track: 0
- Active: 1
- Behind: 3

## Testing

See `requests.http` for comprehensive API testing examples including:

- ✅ Create goals with different priorities
- ✅ Add/withdraw money
- ✅ Update goal details
- ✅ Filter by status and priority
- ✅ View analytics and progress
- ✅ Delete goals

## Database Requirements

1. **categories** table must have entries with `type = 'savings'`
2. User must be authenticated (JWT token required)
3. All amounts stored as `NUMERIC(12, 2)` for precision

## Future Enhancements

- 🔄 Auto-save feature implementation (recurring transfers)
- 📧 Milestone notifications
- 📈 Historical progress tracking
- 🎯 AI-powered savings recommendations
- 💡 Smart monthly target suggestions based on timeline
- 🏆 Achievement badges for completed goals

## Related Modules

- **Categories**: Savings goal categorization
- **Users**: User authentication and ownership
- **Budgets**: Integration with budget planning (future)
- **Notifications**: Goal milestone alerts (future)
