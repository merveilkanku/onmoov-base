-- LMS Schema Update

-- 1. Course Modules
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules are viewable by everyone" 
    ON public.course_modules FOR SELECT USING (true);

CREATE POLICY "Admins and collaborators can manage modules" 
    ON public.course_modules FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'collaborator')
        )
    );

-- 2. Course Lessons
CREATE TYPE lesson_type AS ENUM ('video', 'pdf', 'audio', 'text');

CREATE TABLE IF NOT EXISTS public.course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type lesson_type NOT NULL DEFAULT 'text',
    content_url TEXT, -- URL to video, pdf, or audio file
    text_content TEXT, -- For text lessons or additional notes
    duration_minutes INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons are viewable by enrolled users or admins" 
    ON public.course_lessons FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.course_modules m ON m.course_id = e.course_id
            WHERE m.id = course_lessons.module_id AND e.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'collaborator')
        )
    );

CREATE POLICY "Admins and collaborators can manage lessons" 
    ON public.course_lessons FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'collaborator')
        )
    );

-- 3. Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    progress INTEGER DEFAULT 0, -- Percentage 0-100
    completed BOOLEAN DEFAULT false,
    UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments" 
    ON public.enrollments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments" 
    ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" 
    ON public.enrollments FOR UPDATE USING (auth.uid() = user_id);

-- 4. Lesson Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    last_position INTEGER DEFAULT 0, -- Seconds for video/audio, page number for PDF
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(enrollment_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" 
    ON public.lesson_progress FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE enrollments.id = lesson_progress.enrollment_id
            AND enrollments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own progress" 
    ON public.lesson_progress FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE enrollments.id = lesson_progress.enrollment_id
            AND enrollments.user_id = auth.uid()
        )
    );
