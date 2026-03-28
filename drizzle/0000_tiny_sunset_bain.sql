CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"event_id" integer,
	"action" varchar(30) NOT NULL,
	"resource" varchar(30) NOT NULL,
	"resource_id" integer,
	"details" text,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"approval_id" integer NOT NULL,
	"step_order" integer NOT NULL,
	"approver_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"comment" text,
	"decided_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"title" varchar(300) NOT NULL,
	"description" text,
	"type" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"reference_type" varchar(30),
	"reference_id" integer,
	"requested_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "booths" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"booth_number" varchar(20) NOT NULL,
	"size" varchar(20),
	"dimensions" varchar(20),
	"location_zone" varchar(100),
	"price" integer,
	"amenities" text,
	"status" varchar(20) DEFAULT 'available',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	"event_id" integer,
	"form_data" text NOT NULL,
	"total_estimated" integer NOT NULL,
	"breakdown" text NOT NULL,
	"benchmarks" text,
	"currency" varchar(3) DEFAULT 'SAR',
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_category_defaults" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"base_cost_per_person" integer NOT NULL,
	"min_percentage" integer,
	"max_percentage" integer,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"parent_id" integer,
	"color" varchar(7),
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"change_type" varchar(50) NOT NULL,
	"impact_assessment" text,
	"requested_by" integer,
	"status" varchar(50) DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact_name" varchar(100),
	"email" varchar(255),
	"phone" varchar(30),
	"address" text,
	"city" varchar(100),
	"country" varchar(100),
	"website" varchar(255),
	"logo_path" text,
	"notes" text,
	"user_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"title" varchar(300) NOT NULL,
	"description" text,
	"file_path" text NOT NULL,
	"file_name" varchar(300) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"category" varchar(30),
	"visibility" varchar(20) DEFAULT 'internal',
	"version" integer DEFAULT 1,
	"parent_document_id" integer,
	"folder" varchar(200),
	"uploaded_by" integer,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(50) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"body" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role_in_event" varchar(30) DEFAULT 'support',
	"assigned_by" integer,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"stage" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_by" integer,
	"completed_at" timestamp,
	"is_required" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_exhibitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"exhibitor_id" integer NOT NULL,
	"booth_id" integer,
	"package_type" varchar(20),
	"contract_amount" integer,
	"status" varchar(20) DEFAULT 'pending',
	"special_requirements" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"reported_by" integer,
	"assigned_to" integer,
	"resolution" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_speakers" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"speaker_id" integer NOT NULL,
	"session_id" integer,
	"role" varchar(20) DEFAULT 'speaker',
	"fee" integer,
	"status" varchar(20) DEFAULT 'invited',
	"travel_required" boolean DEFAULT false,
	"accommodation_notes" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"service_description" text,
	"contract_amount" integer,
	"status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"description" text,
	"event_type_id" integer,
	"client_id" integer,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"priority" varchar(10) DEFAULT 'medium',
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Riyadh',
	"venue_name" varchar(200),
	"venue_address" text,
	"venue_city" varchar(100),
	"venue_country" varchar(100),
	"expected_attendees" integer,
	"actual_attendees" integer,
	"budget_estimated" integer,
	"budget_actual" integer,
	"currency" varchar(3) DEFAULT 'SAR',
	"notes" text,
	"cover_image_path" text,
	"health_score" varchar(10) DEFAULT 'green',
	"completion_percentage" integer DEFAULT 0,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exhibitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact_name" varchar(100),
	"email" varchar(255),
	"phone" varchar(30),
	"website" varchar(255),
	"logo_path" text,
	"industry" varchar(100),
	"notes" text,
	"user_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_plan_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"phase_name" varchar(200) NOT NULL,
	"phase_color" varchar(7),
	"phase_order" integer,
	"task_name" varchar(300) NOT NULL,
	"description" text,
	"duration_days" integer NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"role" varchar(100),
	"status" varchar(20) DEFAULT 'pending',
	"dependencies" text,
	"is_critical_path" boolean DEFAULT false,
	"is_optional" boolean DEFAULT false,
	"sort_order" integer NOT NULL,
	"source" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "generated_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	"client_name" varchar(200) NOT NULL,
	"event_id" integer,
	"form_data" text NOT NULL,
	"template_used" varchar(200),
	"complexity_score" integer,
	"plan_data" text,
	"risks" text,
	"recommendations" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'generated',
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invite_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"role_id" integer,
	"event_id" integer,
	"invited_by" integer,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "invite_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "lessons_learned" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"impact" varchar(50),
	"recommendation" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"due_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(30) NOT NULL,
	"link" text,
	"reference_type" varchar(30),
	"reference_id" integer,
	"is_read" boolean DEFAULT false,
	"is_emailed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" varchar(50) NOT NULL,
	"action" varchar(20) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "plan_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "plan_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "plan_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"condition" text NOT NULL,
	"actions" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plan_template_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"sort_order" integer NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plan_template_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"phase_id" integer NOT NULL,
	"name" varchar(300) NOT NULL,
	"duration_days" integer DEFAULT 5 NOT NULL,
	"role" varchar(100),
	"is_optional" boolean DEFAULT false,
	"dependencies" text,
	"sort_order" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "plan_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"event_type" varchar(50),
	"min_attendees" integer,
	"max_attendees" integer,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raci_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"raci_type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recently_viewed" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" integer NOT NULL,
	"resource_name" varchar(255) NOT NULL,
	"viewed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	"event_id" integer,
	"form_data" text NOT NULL,
	"overall_risk_level" varchar(20) NOT NULL,
	"risks" text NOT NULL,
	"mitigations" text,
	"score" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"condition" text NOT NULL,
	"risk_output" text NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "run_sheet_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"scheduled_time" timestamp,
	"duration_minutes" integer,
	"location" varchar(200),
	"responsible_user_id" integer,
	"status" varchar(20) DEFAULT 'pending',
	"sort_order" integer DEFAULT 0,
	"notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(300) NOT NULL,
	"description" text,
	"session_type" varchar(30),
	"date" timestamp NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"location" varchar(200),
	"capacity" integer,
	"sort_order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"title" varchar(200),
	"organization" varchar(200),
	"bio" text,
	"email" varchar(255),
	"phone" varchar(30),
	"photo_path" text,
	"website" varchar(255),
	"social_links" text,
	"user_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "taggables" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" integer NOT NULL,
	"taggable_type" varchar(30) NOT NULL,
	"taggable_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "task_baselines" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"task_id" integer NOT NULL,
	"baseline_start_date" timestamp,
	"baseline_end_date" timestamp,
	"baseline_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"attachment_path" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_dependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"depends_on_task_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"milestone_id" integer,
	"parent_task_id" integer,
	"title" varchar(300) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'todo',
	"priority" varchar(10) DEFAULT 'medium',
	"assigned_to" integer,
	"assigned_team_id" integer,
	"due_date" timestamp,
	"start_date" timestamp,
	"completed_at" timestamp,
	"estimated_hours" integer,
	"actual_hours" integer,
	"sort_order" integer DEFAULT 0,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"lead_id" integer,
	"color" varchar(7),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"hours" integer NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"items_per_page" integer DEFAULT 25,
	"date_format" varchar(20) DEFAULT 'dd/mm/yyyy',
	"notify_task_assigned" boolean DEFAULT true,
	"notify_approval_needed" boolean DEFAULT true,
	"notify_deadline" boolean DEFAULT true,
	"theme" varchar(20) DEFAULT 'light',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(30),
	"avatar_path" text,
	"role_id" integer,
	"user_type" varchar(20) DEFAULT 'internal' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer,
	"criteria" text NOT NULL,
	"matches" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_match_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"criterion" varchar(100) NOT NULL,
	"weight" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT true,
	"description" text,
	CONSTRAINT "vendor_match_weights_criterion_unique" UNIQUE("criterion")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(50),
	"contact_name" varchar(100),
	"email" varchar(255),
	"phone" varchar(30),
	"address" text,
	"website" varchar(255),
	"logo_path" text,
	"tax_number" varchar(50),
	"bank_details" text,
	"rating" integer,
	"notes" text,
	"user_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(30),
	"organization" varchar(200),
	"title" varchar(200),
	"registration_type" varchar(30) DEFAULT 'general',
	"dietary_requirements" text,
	"accessibility_needs" text,
	"status" varchar(20) DEFAULT 'registered',
	"checked_in_at" timestamp,
	"checked_in_by" integer,
	"badge_printed" boolean DEFAULT false,
	"qr_code" varchar(100),
	"notes" text,
	"registered_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "attendees_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "checklist_template_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"stage" varchar(50) NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"is_required" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"event_type" varchar(50),
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"respondent_type" varchar(30) NOT NULL,
	"respondent_id" integer,
	"respondent_name" varchar(200),
	"respondent_email" varchar(255),
	"nps_score" integer,
	"overall_rating" integer,
	"ratings" text,
	"comments" text,
	"suggestions" text,
	"would_recommend" boolean,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"meal_type" varchar(30) NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"location" varchar(200),
	"expected_headcount" integer,
	"actual_headcount" integer,
	"vendor_id" integer,
	"menu_description" text,
	"dietary_options" text,
	"cost_per_person" integer,
	"total_cost" integer,
	"status" varchar(20) DEFAULT 'planned',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"sponsor_id" integer NOT NULL,
	"tier" varchar(30) DEFAULT 'silver' NOT NULL,
	"commitment_amount" integer,
	"paid_amount" integer DEFAULT 0,
	"deliverables" text,
	"deliverables_completed" text,
	"logo_placement" text,
	"status" varchar(20) DEFAULT 'pending',
	"contract_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_success_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"metric_name" varchar(200) NOT NULL,
	"category" varchar(50),
	"target_value" varchar(100) NOT NULL,
	"actual_value" varchar(100),
	"unit" varchar(30),
	"achieved" boolean,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"event_type_id" integer,
	"source_event_id" integer,
	"template_data" text NOT NULL,
	"created_by" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exhibitor_service_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"exhibitor_service_id" integer NOT NULL,
	"event_exhibitor_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_price" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exhibitor_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"unit_price" integer NOT NULL,
	"unit" varchar(30) DEFAULT 'unit',
	"is_available" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" varchar(300) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'SAR',
	"vendor_id" integer,
	"invoice_number" varchar(100),
	"invoice_date" timestamp,
	"invoice_path" text,
	"po_number" varchar(100),
	"payment_status" varchar(20) DEFAULT 'pending',
	"payment_date" timestamp,
	"payment_method" varchar(30),
	"approved_by" integer,
	"approved_at" timestamp,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portal_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer,
	"subject" varchar(300),
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"attachment_path" text,
	"parent_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quality_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"category" varchar(100) NOT NULL,
	"criterion" varchar(300) NOT NULL,
	"measurement" text,
	"target_value" varchar(100),
	"actual_value" varchar(100),
	"status" varchar(20) DEFAULT 'pending',
	"verified_by" integer,
	"verified_at" timestamp,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"contact_name" varchar(100),
	"email" varchar(255),
	"phone" varchar(30),
	"website" varchar(255),
	"logo_path" text,
	"industry" varchar(100),
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stage_gates" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"gate_name" varchar(200) NOT NULL,
	"phase" varchar(50) NOT NULL,
	"required_deliverables" text,
	"reviewer_id" integer,
	"status" varchar(20) DEFAULT 'pending',
	"review_date" timestamp,
	"review_notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"title" varchar(200),
	"organization" varchar(200),
	"email" varchar(255),
	"phone" varchar(30),
	"influence_level" varchar(10) DEFAULT 'medium',
	"interest_level" varchar(10) DEFAULT 'medium',
	"communication_channel" varchar(50),
	"engagement_strategy" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"template_id" integer,
	"respondent_name" varchar(200),
	"respondent_email" varchar(255),
	"respondent_type" varchar(30),
	"answers" text NOT NULL,
	"nps_score" integer,
	"submitted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "survey_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"target_audience" varchar(30) NOT NULL,
	"questions" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_id" integer,
	"task_id" integer,
	"date" timestamp NOT NULL,
	"hours" integer NOT NULL,
	"description" text,
	"billable" boolean DEFAULT true,
	"status" varchar(20) DEFAULT 'draft',
	"approved_by" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "travel_arrangements" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"user_id" integer,
	"guest_name" varchar(200),
	"guest_type" varchar(30),
	"flight_arrival" text,
	"flight_departure" text,
	"flight_status" varchar(20) DEFAULT 'pending',
	"flight_booking_ref" varchar(100),
	"hotel_name" varchar(200),
	"hotel_check_in" timestamp,
	"hotel_check_out" timestamp,
	"hotel_confirmation" varchar(100),
	"hotel_room_type" varchar(50),
	"hotel_status" varchar(20) DEFAULT 'pending',
	"airport_transfer" boolean DEFAULT false,
	"transfer_details" text,
	"visa_required" boolean DEFAULT false,
	"visa_status" varchar(20) DEFAULT 'not_required',
	"visa_number" varchar(100),
	"per_diem_rate" integer,
	"per_diem_days" integer,
	"total_cost" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_vendor_id" integer NOT NULL,
	"milestone_name" varchar(200) NOT NULL,
	"amount" integer NOT NULL,
	"percentage" integer,
	"due_date" timestamp,
	"payment_type" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"invoice_number" varchar(100),
	"invoice_path" text,
	"paid_date" timestamp,
	"approved_by" integer,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_vendor_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"quality_rating" integer,
	"timeliness_rating" integer,
	"communication_rating" integer,
	"value_rating" integer,
	"overall_rating" integer,
	"comments" text,
	"would_rehire" boolean,
	"rated_by" integer,
	"rated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booths" ADD CONSTRAINT "booths_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_calculations" ADD CONSTRAINT "budget_calculations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_calculations" ADD CONSTRAINT "budget_calculations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_assignments" ADD CONSTRAINT "event_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist_items" ADD CONSTRAINT "event_checklist_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_checklist_items" ADD CONSTRAINT "event_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_exhibitors" ADD CONSTRAINT "event_exhibitors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_exhibitors" ADD CONSTRAINT "event_exhibitors_exhibitor_id_exhibitors_id_fk" FOREIGN KEY ("exhibitor_id") REFERENCES "public"."exhibitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_exhibitors" ADD CONSTRAINT "event_exhibitors_booth_id_booths_id_fk" FOREIGN KEY ("booth_id") REFERENCES "public"."booths"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_issues" ADD CONSTRAINT "event_issues_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_issues" ADD CONSTRAINT "event_issues_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_issues" ADD CONSTRAINT "event_issues_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendors" ADD CONSTRAINT "event_vendors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_vendors" ADD CONSTRAINT "event_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibitors" ADD CONSTRAINT "exhibitors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_plan_tasks" ADD CONSTRAINT "generated_plan_tasks_plan_id_generated_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."generated_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_plans" ADD CONSTRAINT "generated_plans_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_plans" ADD CONSTRAINT "generated_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons_learned" ADD CONSTRAINT "lessons_learned_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons_learned" ADD CONSTRAINT "lessons_learned_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_template_phases" ADD CONSTRAINT "plan_template_phases_template_id_plan_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."plan_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_template_tasks" ADD CONSTRAINT "plan_template_tasks_phase_id_plan_template_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."plan_template_phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raci_assignments" ADD CONSTRAINT "raci_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raci_assignments" ADD CONSTRAINT "raci_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raci_assignments" ADD CONSTRAINT "raci_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_sheet_items" ADD CONSTRAINT "run_sheet_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_sheet_items" ADD CONSTRAINT "run_sheet_items_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggables" ADD CONSTRAINT "taggables_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_baselines" ADD CONSTRAINT "task_baselines_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_baselines" ADD CONSTRAINT "task_baselines_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_tasks_id_fk" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_team_id_teams_id_fk" FOREIGN KEY ("assigned_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_lead_id_users_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_match_results" ADD CONSTRAINT "vendor_match_results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_match_results" ADD CONSTRAINT "vendor_match_results_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_meals" ADD CONSTRAINT "event_meals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_meals" ADD CONSTRAINT "event_meals_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_success_metrics" ADD CONSTRAINT "event_success_metrics_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_templates" ADD CONSTRAINT "event_templates_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_templates" ADD CONSTRAINT "event_templates_source_event_id_events_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_templates" ADD CONSTRAINT "event_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibitor_service_orders" ADD CONSTRAINT "exhibitor_service_orders_exhibitor_service_id_exhibitor_services_id_fk" FOREIGN KEY ("exhibitor_service_id") REFERENCES "public"."exhibitor_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibitor_services" ADD CONSTRAINT "exhibitor_services_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_criteria" ADD CONSTRAINT "quality_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_criteria" ADD CONSTRAINT "quality_criteria_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_gates" ADD CONSTRAINT "stage_gates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_gates" ADD CONSTRAINT "stage_gates_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_template_id_survey_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."survey_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_templates" ADD CONSTRAINT "survey_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_arrangements" ADD CONSTRAINT "travel_arrangements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_arrangements" ADD CONSTRAINT "travel_arrangements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_event_vendor_id_event_vendors_id_fk" FOREIGN KEY ("event_vendor_id") REFERENCES "public"."event_vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payments" ADD CONSTRAINT "vendor_payments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_event_vendor_id_event_vendors_id_fk" FOREIGN KEY ("event_vendor_id") REFERENCES "public"."event_vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_ratings" ADD CONSTRAINT "vendor_ratings_rated_by_users_id_fk" FOREIGN KEY ("rated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_event_idx" ON "activity_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "activity_created_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "approval_steps_approval_idx" ON "approval_steps" USING btree ("approval_id");--> statement-breakpoint
CREATE INDEX "approvals_event_idx" ON "approvals" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "approvals_status_idx" ON "approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "booths_event_idx" ON "booths" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "budget_calculations_event_idx" ON "budget_calculations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "change_requests_event_idx" ON "change_requests" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "change_requests_status_idx" ON "change_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "change_requests_requested_by_idx" ON "change_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "documents_event_idx" ON "documents" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "documents_visibility_idx" ON "documents" USING btree ("visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "event_assignment_unique_idx" ON "event_assignments" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "checklist_items_event_idx" ON "event_checklist_items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "checklist_items_stage_idx" ON "event_checklist_items" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "event_exhibitors_event_idx" ON "event_exhibitors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_exhibitors_exhibitor_idx" ON "event_exhibitors" USING btree ("exhibitor_id");--> statement-breakpoint
CREATE INDEX "event_issues_event_idx" ON "event_issues" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_speakers_event_idx" ON "event_speakers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_speakers_speaker_idx" ON "event_speakers" USING btree ("speaker_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_team_unique_idx" ON "event_teams" USING btree ("event_id","team_id");--> statement-breakpoint
CREATE INDEX "event_vendors_event_idx" ON "event_vendors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_vendors_vendor_idx" ON "event_vendors" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_client_idx" ON "events" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "events_dates_idx" ON "events" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "generated_plan_tasks_plan_idx" ON "generated_plan_tasks" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "generated_plans_event_idx" ON "generated_plans" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "generated_plans_creator_idx" ON "generated_plans" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "generated_plans_status_idx" ON "generated_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invite_tokens_email_idx" ON "invite_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invite_tokens_invited_by_idx" ON "invite_tokens" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "lessons_learned_event_idx" ON "lessons_learned" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "lessons_learned_category_idx" ON "lessons_learned" USING btree ("category");--> statement-breakpoint
CREATE INDEX "milestones_event_idx" ON "milestones" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "notif_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_module_action_idx" ON "permissions" USING btree ("module","action");--> statement-breakpoint
CREATE INDEX "plan_rules_category_idx" ON "plan_rules" USING btree ("category");--> statement-breakpoint
CREATE INDEX "plan_rules_active_idx" ON "plan_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "plan_template_phases_template_idx" ON "plan_template_phases" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "plan_template_tasks_phase_idx" ON "plan_template_tasks" USING btree ("phase_id");--> statement-breakpoint
CREATE UNIQUE INDEX "raci_unique_idx" ON "raci_assignments" USING btree ("event_id","task_id","user_id");--> statement-breakpoint
CREATE INDEX "raci_event_idx" ON "raci_assignments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "recently_viewed_user_idx" ON "recently_viewed" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recently_viewed_resource_idx" ON "recently_viewed" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "risk_assessments_event_idx" ON "risk_assessments" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_perm_unique_idx" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "run_sheet_event_idx" ON "run_sheet_items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "sessions_event_idx" ON "sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "taggables_type_id_idx" ON "taggables" USING btree ("taggable_type","taggable_id");--> statement-breakpoint
CREATE INDEX "task_baselines_event_idx" ON "task_baselines" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "task_baselines_task_idx" ON "task_baselines" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_comments_task_idx" ON "task_comments" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_dep_unique_idx" ON "task_dependencies" USING btree ("task_id","depends_on_task_id");--> statement-breakpoint
CREATE INDEX "tasks_event_idx" ON "tasks" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_unique_idx" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "time_entries_task_idx" ON "time_entries" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "time_entries_user_idx" ON "time_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_type_idx" ON "users" USING btree ("user_type");--> statement-breakpoint
CREATE INDEX "attendees_event_idx" ON "attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "attendees_email_idx" ON "attendees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "attendees_status_idx" ON "attendees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_feedback_event_idx" ON "event_feedback" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_meals_event_idx" ON "event_meals" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsors_event_idx" ON "event_sponsors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsors_sponsor_idx" ON "event_sponsors" USING btree ("sponsor_id");--> statement-breakpoint
CREATE INDEX "event_success_event_idx" ON "event_success_metrics" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "expenses_event_idx" ON "expenses" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_vendor_idx" ON "expenses" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "expenses_payment_status_idx" ON "expenses" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "portal_messages_event_idx" ON "portal_messages" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "portal_messages_sender_idx" ON "portal_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "portal_messages_recipient_idx" ON "portal_messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "quality_criteria_event_idx" ON "quality_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "stage_gates_event_idx" ON "stage_gates" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "stakeholders_event_idx" ON "stakeholders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "survey_responses_event_idx" ON "survey_responses" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "timesheets_user_idx" ON "timesheets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "timesheets_event_idx" ON "timesheets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "timesheets_date_idx" ON "timesheets" USING btree ("date");--> statement-breakpoint
CREATE INDEX "travel_event_idx" ON "travel_arrangements" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "travel_user_idx" ON "travel_arrangements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendor_payments_ev_idx" ON "vendor_payments" USING btree ("event_vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_ratings_event_idx" ON "vendor_ratings" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "vendor_ratings_vendor_idx" ON "vendor_ratings" USING btree ("vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_ratings_unique_idx" ON "vendor_ratings" USING btree ("event_vendor_id","rated_by");