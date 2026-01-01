import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Course, CourseProgress, LessonType } from '../types';
import { ImageAnalyzer } from './ImageAnalyzer';
import { ImageEditor } from './ImageEditor';
import { FileText, Menu, X, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { fetchCourseProgress, fetchCourseResume, patchCourseProgress } from '../services/progressApi';
import { apiFetch } from '../services/apiClient';

const IFRAME_BASE_STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    background: #050914;
    color: #e5e7eb;
    font-family: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
  }
  a { color: #7dd3fc; }
  img { max-width: 100%; display: block; }
`;

interface CourseViewerProps {
  course: Course;
  onBack: () => void;
  isSubscribed: boolean;
  initialProgress?: CourseProgress;
  onProgressChange?: (courseId: string, progress: CourseProgress) => void;
}

export const CourseViewer: React.FC<CourseViewerProps> = ({
  course,
  onBack,
  isSubscribed,
  initialProgress,
  onProgressChange,
}) => {
  const apiBaseUrl =
    (import.meta as any).env?.DEV === true ? '' : (import.meta as any).env?.VITE_API_BASE_URL ?? '';
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const activeLesson = course.lessons[activeLessonIndex];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [copiedExample, setCopiedExample] = useState<number | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress>(initialProgress ?? {});
  const [progressLoading, setProgressLoading] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const [llmHtml, setLlmHtml] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmOutline, setLlmOutline] = useState<unknown>(null);
  const [llmCss, setLlmCss] = useState<string | null>(null);
  const [llmSections, setLlmSections] = useState<Record<string, string>>({});
  const [llmSectionOrder, setLlmSectionOrder] = useState<string[]>([]);
  const llmCssRef = useRef<string | null>(null);
  const llmSectionsRef = useRef<Record<string, string>>({});
  const llmSectionOrderRef = useRef<string[]>([]);
  const llmOutlineRef = useRef<unknown>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  const syncProgress = useCallback(
    (next: CourseProgress) => {
      setCourseProgress(next);
      onProgressChange?.(course.id, next);
    },
    [course.id, onProgressChange],
  );

  useEffect(() => {
    setCourseProgress(initialProgress ?? {});
  }, [initialProgress, course.id]);

  const applyProgressPatch = useCallback(
    async (patch: Parameters<typeof patchCourseProgress>[1]) => {
      try {
        const updated = await patchCourseProgress(course.id, patch);
        syncProgress(updated ?? {});
      } catch (error) {
        console.error('Failed to update progress', error);
      }
    },
    [course.id, syncProgress],
  );

  useEffect(() => {
    let cancelled = false;
    setProgressLoading(true);
    (async () => {
      try {
        const [progressData, resumeData] = await Promise.all([
          fetchCourseProgress(course.id),
          fetchCourseResume(course.id),
        ]);

        if (cancelled) return;
        syncProgress(progressData ?? {});

        const resumeLessonId = resumeData?.lesson_id;
        const resumeIndex = resumeLessonId
          ? course.lessons.findIndex((lesson) => lesson.id === resumeLessonId)
          : -1;
        const nextLessonIndex = resumeIndex >= 0 ? resumeIndex : 0;

        setActiveLessonIndex(nextLessonIndex);

        const nextLesson = course.lessons[nextLessonIndex];
        if (nextLesson) {
          await applyProgressPatch({
            op: 'set_resume',
            lessonId: nextLesson.id,
          });
        }
      } catch (error) {
        console.error('Failed to load course progress', error);
      } finally {
        if (!cancelled) setProgressLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyProgressPatch, course.id, course.lessons, syncProgress]);

  const heroSubtitle = useMemo(() => {
    const { blocks } = activeLesson;
    if (!blocks) return null;
    if (Array.isArray(blocks)) {
      const hero = blocks.find(
        (block) => block && typeof block === 'object' && (block as any).type === 'hero',
      );
      if (hero && typeof (hero as any).subtitle === 'string') {
        return (hero as any).subtitle as string;
      }
    }
    if (blocks && typeof blocks === 'object' && (blocks as any).type === 'hero') {
      const subtitle = (blocks as any).subtitle;
      if (typeof subtitle === 'string') return subtitle;
    }
    return null;
  }, [activeLesson]);

  const isWorkshopLesson = useMemo(
    () => (activeLesson.lessonType ?? '').toLowerCase() === 'workshop',
    [activeLesson.lessonType],
  );

  const quizBlock = useMemo(() => {
    const { blocks } = activeLesson;
    const extract = (block: unknown) => {
      if (block && typeof block === 'object' && (block as any).type === 'quiz') {
        const quizId =
          typeof (block as any).id === 'string'
            ? (block as any).id
            : typeof (block as any).quizId === 'string'
              ? (block as any).quizId
              : typeof (block as any).quiz_id === 'string'
                ? (block as any).quiz_id
                : null;
        const title = typeof (block as any).title === 'string' ? (block as any).title : null;
        const question = typeof (block as any).question === 'string' ? (block as any).question : null;
        const note = typeof (block as any).note === 'string' ? (block as any).note : null;
        const options = Array.isArray((block as any).options)
          ? ((block as any).options as unknown[]).filter((opt) => typeof opt === 'string') as string[]
          : null;
        return { id: quizId ?? 'default', title, question, note, options };
      }
      return null;
    };

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        const value = extract(block);
        if (value) return value;
      }
    } else {
      const value = extract(blocks);
      if (value) return value;
    }
    return null;
  }, [activeLesson]);

  useEffect(() => {
    if (!quizBlock?.options) {
      setQuizAnswer(null);
      return;
    }

    const lessonProgress = courseProgress?.lessons?.[activeLesson.id];
    const saved = lessonProgress?.quiz_answers?.[quizBlock.id ?? 'default'];
    if (saved === undefined || saved === null) {
      setQuizAnswer(null);
      return;
    }

    const matchedByValue = quizBlock.options.findIndex((option) => option === saved);
    if (matchedByValue >= 0) {
      setQuizAnswer(matchedByValue);
      return;
    }

    if (typeof saved === 'number' && quizBlock.options[saved]) {
      setQuizAnswer(saved);
      return;
    }

    setQuizAnswer(null);
  }, [activeLesson.id, courseProgress, quizBlock]);

  useEffect(() => {
    setPromptInput('');
    setIsSendingPrompt(false);
    setLlmHtml(null);
    setLlmError(null);
    setLlmOutline(null);
    setLlmCss(null);
    setLlmSections({});
    setLlmSectionOrder([]);
    llmCssRef.current = null;
    llmSectionsRef.current = {};
    llmSectionOrderRef.current = [];
    llmOutlineRef.current = null;
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
  }, [activeLesson.id]);

  useEffect(
    () => () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
        streamControllerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    llmCssRef.current = llmCss;
  }, [llmCss]);

  useEffect(() => {
    llmSectionsRef.current = llmSections;
  }, [llmSections]);

  useEffect(() => {
    llmSectionOrderRef.current = llmSectionOrder;
  }, [llmSectionOrder]);

  useEffect(() => {
    llmOutlineRef.current = llmOutline;
  }, [llmOutline]);

  const examplesBlock = useMemo(() => {
    const { blocks } = activeLesson;
    const extract = (block: unknown) => {
      if (block && typeof block === 'object' && (block as any).type === 'examples') {
        const title = typeof (block as any).title === 'string' ? (block as any).title : null;
        const tip = typeof (block as any).tip === 'string' ? (block as any).tip : null;
        const itemsRaw = (block as any).items;
        const items = Array.isArray(itemsRaw)
          ? itemsRaw
              .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const label = typeof (item as any).label === 'string' ? (item as any).label : null;
                const content = typeof (item as any).content === 'string' ? (item as any).content : null;
                const notes = Array.isArray((item as any).notes)
                  ? ((item as any).notes as unknown[])
                      .filter((note) => typeof note === 'string')
                      .map((note) => note as string)
                  : null;
                if (!label && !content) return null;
                return { label, content, notes };
              })
              .filter(Boolean) as { label: string | null; content: string | null; notes: string[] | null }[]
          : null;
        return { title, tip, items };
      }
      return null;
    };

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        const value = extract(block);
        if (value) return value;
      }
    } else {
      const value = extract(blocks);
      if (value) return value;
    }
    return null;
  }, [activeLesson]);

  const handleCopyExample = async (text: string | null, idx: number) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExample(idx);
      setTimeout(() => setCopiedExample((current) => (current === idx ? null : current)), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleQuizSelect = useCallback(
    async (optionIndex: number, optionValue: string | null) => {
      setQuizAnswer(optionIndex);
      await applyProgressPatch({
        op: 'quiz_answer',
        lessonId: activeLesson.id,
        quizId: quizBlock?.id ?? 'default',
        answer: optionValue ?? optionIndex,
      });
    },
    [activeLesson.id, applyProgressPatch, quizBlock?.id],
  );

  const goToLesson = useCallback(
    (targetIndex: number, options?: { completeCurrent?: boolean }) => {
      if (targetIndex < 0 || targetIndex >= course.lessons.length) return;
      if (targetIndex === activeLessonIndex) return;

      const targetLesson = course.lessons[targetIndex];
      const currentLesson = course.lessons[activeLessonIndex];

      setActiveLessonIndex(targetIndex);
      setSidebarOpen(false);

      void (async () => {
        if (options?.completeCurrent && currentLesson) {
          await applyProgressPatch({
            op: 'lesson_status',
            lessonId: currentLesson.id,
            status: 'completed',
            completedAt: new Date().toISOString(),
          });
        }

        await applyProgressPatch({
          op: 'set_resume',
          lessonId: targetLesson.id,
        });
      })();
    },
    [activeLessonIndex, applyProgressPatch, course.lessons],
  );

  const parseSseEvent = useCallback((rawEvent: string): { event: string; data: string } => {
    let eventName = 'message';
    const dataLines: string[] = [];

    rawEvent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('event:')) {
        eventName = trimmed.slice('event:'.length).trim();
      } else if (trimmed.startsWith('data:')) {
        dataLines.push(trimmed.slice('data:'.length).trim());
      }
    });

    return { event: eventName, data: dataLines.join('\n') };
  }, []);

  const parseJsonSafe = useCallback((value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }, []);

  const extractKeysFromOutline = useCallback((outline: unknown): string[] => {
    if (!outline) return [];
    if (Array.isArray(outline)) {
      return outline
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            const candidate = (item as any).key ?? (item as any).id ?? (item as any).name;
            return typeof candidate === 'string' ? candidate : null;
          }
          return null;
        })
        .filter((key): key is string => Boolean(key));
    }
    if (typeof outline === 'object' && outline !== null && Array.isArray((outline as any).sections)) {
      return extractKeysFromOutline((outline as any).sections);
    }
    return [];
  }, []);

  const buildHtml = useCallback(
    (
      css: string | null,
      outline: unknown,
      sections: Record<string, string>,
      sectionOrder: string[],
    ): string => {
      const outlineKeys = extractKeysFromOutline(outline);
      const orderedKeys =
        outlineKeys.length > 0
          ? outlineKeys.filter((key) => sections[key])
          : sectionOrder.filter((key) => sections[key]);
      const keysToRender = orderedKeys.length ? orderedKeys : Object.keys(sections);

      const styleTag = css ? `<style>${css}</style>` : '';
      const body = keysToRender.map((key) => sections[key]).filter(Boolean).join('\n');
      return [styleTag, body].filter(Boolean).join('\n').trim();
    },
    [extractKeysFromOutline],
  );

  const liveHtmlFromParts = useMemo(
    () => buildHtml(llmCss ?? null, llmOutline, llmSections, llmSectionOrder),
    [buildHtml, llmCss, llmOutline, llmSections, llmSectionOrder],
  );

  const iframeHtml = useMemo(() => {
    const raw = (llmHtml ?? liveHtmlFromParts ?? '').trim();
    if (!raw) return null;

    const stylePieces = [IFRAME_BASE_STYLES];
    if (llmCss && !raw.includes(llmCss)) {
      stylePieces.push(llmCss);
    }
    const styleTag = `<style>${stylePieces.join('\n')}</style>`;
    const tailwindScriptTag = `<script src="https://cdn.tailwindcss.com"></script>`;
    const headInjection = `${tailwindScriptTag}${styleTag}`;

    const ensureHead = (html: string) => {
      if (/<head[^>]*>/i.test(html)) {
        return html.replace(/<head[^>]*>/i, (match) => `${match}${headInjection}`);
      }
      if (/<html[^>]*>/i.test(html)) {
        return html.replace(/<html[^>]*>/i, (match) => `${match}<head>${headInjection}</head>`);
      }
      return `${headInjection}\n${html}`;
    };

    const withHead = ensureHead(raw);
    const hasBodyTag = /<body[^>]*>/i.test(withHead);

    if (hasBodyTag) {
      return `<!doctype html>\n${withHead}`;
    }

    return `<!doctype html>
<html>
<head>${styleTag}</head>
<body>
${withHead}
</body>
</html>`;
  }, [llmCss, llmHtml, liveHtmlFromParts]);

  const cleanupStream = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
  }, []);

  const applyFinalPayload = useCallback(
    (payload: any) => {
      const payloadSections: Record<string, string> = {};
      if (payload?.sections && typeof payload.sections === 'object') {
        Object.entries(payload.sections as Record<string, string | unknown>).forEach(([key, value]) => {
          if (typeof value === 'string') {
            const parsedSection = parseJsonSafe(value);
            if (parsedSection && typeof parsedSection === 'object' && typeof (parsedSection as any).html === 'string') {
              payloadSections[key] = (parsedSection as any).html as string;
            } else {
              payloadSections[key] = value;
            }
          } else if (value && typeof value === 'object') {
            const htmlValue =
              typeof (value as any).html === 'string'
                ? (value as any).html
                : typeof (value as any).content === 'string'
                  ? (value as any).content
                  : null;
            if (htmlValue) {
              payloadSections[key] = htmlValue;
            }
          }
        });
      }

      const mergedSections = { ...llmSectionsRef.current, ...payloadSections };
      llmSectionsRef.current = mergedSections;
      setLlmSections(mergedSections);

      const nextCss =
        typeof payload?.css === 'string' ? payload.css : llmCssRef.current;
      llmCssRef.current = nextCss ?? null;
      setLlmCss(nextCss ?? null);

      const nextOutline = payload?.outline ?? llmOutlineRef.current;
      llmOutlineRef.current = nextOutline ?? null;
      setLlmOutline(nextOutline ?? null);

      const outlineKeys = extractKeysFromOutline(nextOutline);
      const mergedOrder =
        outlineKeys.length > 0
          ? outlineKeys.filter((key) => mergedSections[key])
          : (() => {
              const base = [...llmSectionOrderRef.current];
              Object.keys(payloadSections).forEach((key) => {
                if (!base.includes(key)) base.push(key);
              });
              return base.filter((key) => mergedSections[key]);
            })();
      llmSectionOrderRef.current = mergedOrder;
      setLlmSectionOrder(mergedOrder);

      const htmlFromPayload = typeof payload?.html === 'string' ? payload.html : null;
      const finalHtml =
        htmlFromPayload && htmlFromPayload.trim().length > 0
          ? htmlFromPayload
          : buildHtml(nextCss ?? null, nextOutline, mergedSections, mergedOrder);

      if (finalHtml?.trim().length) setLlmHtml(finalHtml);

      const errorMessage =
        typeof payload?.error === 'string'
          ? payload.error
          : typeof payload?.message === 'string'
            ? payload.message
            : null;
      if (errorMessage) setLlmError(errorMessage);

      setIsSendingPrompt(false);
      cleanupStream();
    },
    [buildHtml, cleanupStream, extractKeysFromOutline, parseJsonSafe],
  );

  const handleStreamEvent = useCallback(
    (incomingEventName: string, data: string) => {
      const payload = parseJsonSafe(data);
      const payloadType =
        payload && typeof payload === 'object' && typeof (payload as any).type === 'string'
          ? ((payload as any).type as string)
          : null;
      const eventName = (incomingEventName || payloadType || 'message').toLowerCase();
      const extractHtml = (value: string) => {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object' && typeof (parsed as any).html === 'string') {
            return (parsed as any).html as string;
          }
        } catch {
          // not json, ignore
        }
        return value;
      };

      if (eventName === 'css') {
        const cssValue =
          payload && typeof (payload as any).css === 'string'
            ? (payload as any).css
            : payload && typeof (payload as any).content === 'string'
              ? (payload as any).content
              : data;
        llmCssRef.current = cssValue;
        setLlmCss(cssValue);

        const partialHtml = buildHtml(
          llmCssRef.current,
          llmOutlineRef.current,
          llmSectionsRef.current,
          llmSectionOrderRef.current,
        );
        if (partialHtml) setLlmHtml(partialHtml);
        return;
      }

      if (eventName === 'section' || eventName.startsWith('section:')) {
        const key =
          eventName === 'section'
            ? ((payload as any)?.id ?? (payload as any)?.section ?? 'section')
            : eventName.slice('section:'.length) || (payload as any)?.id || 'section';
        const html =
          payload && typeof (payload as any).html === 'string'
            ? (payload as any).html
            : payload && typeof (payload as any).content === 'string'
              ? (payload as any).content
              : extractHtml(data);
        const nextSections = { ...llmSectionsRef.current, [key]: html };
        llmSectionsRef.current = nextSections;
        setLlmSections(nextSections);

        const nextOrder = llmSectionOrderRef.current.includes(key)
          ? llmSectionOrderRef.current
          : [...llmSectionOrderRef.current, key];
        llmSectionOrderRef.current = nextOrder;
        setLlmSectionOrder(nextOrder);

        const partialHtml = buildHtml(
          llmCssRef.current,
          llmOutlineRef.current,
          nextSections,
          nextOrder,
        );
        if (partialHtml) setLlmHtml(partialHtml);
        return;
      }

      if (eventName === 'html') {
        applyFinalPayload({
          ...(payload ?? {}),
          html:
            payload && typeof (payload as any).html === 'string'
              ? (payload as any).html
              : payload && typeof (payload as any).content === 'string'
                ? (payload as any).content
                : extractHtml(data),
        });
        return;
      }

      if (eventName === 'done') {
        const finalPayload =
          payload &&
          typeof payload === 'object' &&
          typeof (payload as any).html !== 'string' &&
          typeof (payload as any).content === 'string'
            ? { ...(payload as any), html: (payload as any).content }
            : payload ?? {};
        applyFinalPayload(finalPayload);
        return;
      }

      if (eventName === 'error') {
        const message =
          ((payload as any)?.error ?? (payload as any)?.message ?? data) ||
          'Ошибка генерации HTML. Попробуйте ещё раз.';
        const hasRenderablePayload =
          payload &&
          typeof payload === 'object' &&
          (typeof (payload as any).html === 'string' ||
            typeof (payload as any).css === 'string' ||
            (payload as any).sections);

        if (hasRenderablePayload) {
          applyFinalPayload({
            ...(payload as any),
            html:
              (payload as any)?.html && typeof (payload as any).html === 'string'
                ? (payload as any).html
                : extractHtml(data),
          });
          return;
        }

        setLlmError(typeof message === 'string' ? message : String(message));
        setIsSendingPrompt(false);
        cleanupStream();
      }
    },
    [applyFinalPayload, buildHtml, cleanupStream, parseJsonSafe],
  );

  const startHtmlStream = useCallback(
    (jobId: string) => {
      const controller = new AbortController();
      streamControllerRef.current = controller;

      const run = async () => {
        try {
          const response = await fetch(
            `${apiBaseUrl}/api/v1/html/stream?jobId=${encodeURIComponent(jobId)}`,
            {
              method: 'GET',
              signal: controller.signal,
              credentials: 'include',
              headers: { Accept: 'text/event-stream' },
            },
          );

          if (!response.ok) {
            throw new Error(`Stream failed: ${response.status} ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error('Пустой ответ от LLM при стриминге.');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';

            for (const rawEvent of events) {
              const parsed = parseSseEvent(rawEvent);
              handleStreamEvent(parsed.event, parsed.data);
            }

            if (done) break;
          }

          if (buffer.trim().length > 0) {
            const parsed = parseSseEvent(buffer);
            handleStreamEvent(parsed.event, parsed.data);
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error('HTML stream error', error);
          setLlmError('Ошибка при получении потока. Попробуйте снова.');
          setIsSendingPrompt(false);
        } finally {
          if (!controller.signal.aborted) {
            streamControllerRef.current = null;
          }
        }
      };

      void run();
    },
    [apiBaseUrl, handleStreamEvent, parseSseEvent],
  );

  const handlePromptSubmit = useCallback(async () => {
    const prompt = promptInput.trim();
    if (!prompt || isSendingPrompt || !isWorkshopLesson) return;

    cleanupStream();
    setIsSendingPrompt(true);
    setLlmError(null);
    setLlmHtml(null);
    setLlmCss(null);
    setLlmSections({});
    setLlmSectionOrder([]);
    setLlmOutline(null);
    llmCssRef.current = null;
    llmSectionsRef.current = {};
    llmSectionOrderRef.current = [];
    llmOutlineRef.current = null;

    try {
      const response = await apiFetch<{ jobId?: string; outline?: unknown }>(
        '/api/v1/html/start',
        {
          method: 'POST',
          body: JSON.stringify({ prompt, lessonId: activeLesson.id }),
        },
      );

      if (!response?.jobId) {
        throw new Error('Сервер не вернул идентификатор задачи генерации.');
      }

      setLlmOutline(response.outline ?? null);
      startHtmlStream(response.jobId);
    } catch (error) {
      console.error('Failed to send prompt to LLM', error);
      const message =
        error instanceof Error ? error.message : 'Ошибка при запросе LLM. Попробуйте ещё раз.';
      setLlmError(message);
      setIsSendingPrompt(false);
    }
  }, [
    activeLesson.id,
    cleanupStream,
    isSendingPrompt,
    isWorkshopLesson,
    promptInput,
    startHtmlStream,
  ]);

  const ctaData = useMemo(() => {
    const { blocks } = activeLesson;
    const extract = (block: unknown) => {
      if (block && typeof block === 'object' && (block as any).type === 'cta') {
        const buttonText = typeof (block as any).buttonText === 'string' ? (block as any).buttonText : null;
        const action = typeof (block as any).action === 'string' ? (block as any).action : null;
        if (buttonText || action) {
          return { buttonText, action };
        }
      }
      return null;
    };

    if (Array.isArray(blocks)) {
      for (const block of blocks) {
        const value = extract(block);
        if (value) return value;
      }
    } else {
      const value = extract(blocks);
      if (value) return value;
    }
    return { buttonText: null, action: null };
  }, [activeLesson]);

  // Render the Right Side Content based on Lesson Type
  const renderRightPanel = () => {
    switch (activeLesson.type) {
      case LessonType.INTERACTIVE_ANALYSIS:
        return <ImageAnalyzer />;
      case LessonType.INTERACTIVE_EDIT:
        return <ImageEditor />;
      case LessonType.VIDEO_TEXT:
      default:
        // Default interactive playground for text-based lessons
        return (
          <div className="flex flex-col h-full bg-[#050914] border-l border-white/5">
            <div className="flex-1 border-b border-white/5 relative overflow-hidden">
              {iframeHtml ? (
                <iframe
                  key={`${activeLesson.id}-${iframeHtml.length}`}
                  srcDoc={iframeHtml}
                  title="LLM Generated Site"
                  className="w-full h-full bg-black"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
                  {isSendingPrompt ? (
                    <>
                      <div className="w-10 h-10 border-2 border-white/10 border-t-vibe-500 rounded-full animate-spin"></div>
                      <p className="font-mono text-sm text-slate-200">Генерируем сайт...</p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-16 h-16 opacity-20" />
                      <p className="font-mono text-sm">Waiting for input...</p>
                      {!isWorkshopLesson && (
                        <p className="text-xs mt-1 opacity-50">
                          В этом уроке нет интерактивного задания AI.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="h-1/3 p-4 bg-[#02050e] flex flex-col">
              <div className="flex gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
              {llmError && !iframeHtml && (
                <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2">
                  {llmError}
                </div>
              )}
              <div className="relative flex-1 mt-1">
                <textarea
                  disabled={!isWorkshopLesson}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className={`w-full h-full bg-transparent text-sm resize-none font-mono focus:outline-none pr-28 ${
                    isWorkshopLesson ? 'text-slate-200' : 'text-slate-500'
                  }`}
                  placeholder="// Console ready..."
                />
                {isWorkshopLesson && promptInput.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handlePromptSubmit}
                    disabled={isSendingPrompt}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-vibe-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-vibe-900/30 hover:bg-vibe-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ cursor: 'pointer' }}
                  >
                    <Send className="w-4 h-4" />
                    {isSendingPrompt ? 'Отправляем...' : 'Отправить'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-void text-white overflow-hidden font-sans">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#050914] flex items-center justify-between px-4 shrink-0 z-30">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider hover:bg-white/5 px-3 py-1.5 rounded-lg"
                >
                    <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
                <h1 className="font-bold text-lg hidden md:block font-display tracking-tight text-slate-200">{course.title}</h1>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs text-vibe-400 font-mono px-3 py-1 bg-vibe-500/10 border border-vibe-500/20 rounded-full">
                    Урок {activeLessonIndex + 1} / {course.lessons.length}
                </span>
                <button 
                    className="md:hidden text-slate-300"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X /> : <Menu />}
                </button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar (Lesson List) */}
            <aside className={`
                absolute md:relative z-20 w-72 bg-[#02050e] border-r border-white/5 h-full transition-transform duration-300 flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="overflow-y-auto h-full pb-20 custom-scrollbar">
                    {course.lessons.map((lesson, idx) => (
                        <button
                            key={lesson.id}
                            onClick={() => goToLesson(idx)}
                            className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/5 transition-all flex items-start gap-3 group
                                ${activeLessonIndex === idx ? 'bg-white/5 border-l-2 border-l-vibe-500' : 'border-l-2 border-l-transparent'}
                            `}
                        >
                            <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors
                                ${activeLessonIndex === idx ? 'bg-vibe-500 text-white shadow-lg shadow-vibe-500/20' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}
                            `}>
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className={`text-sm font-medium mb-1 transition-colors ${activeLessonIndex === idx ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                    {lesson.title}
                                </h4>
                                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">
                                    {lesson.lessonTypeRu ?? lesson.lessonType ?? lesson.type ?? ''}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                
                {/* Left Side: Description & Video */}
                <div className="w-full md:w-1/2 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-void">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-8">
                             <span className="text-vibe-400 text-xs font-bold uppercase tracking-widest mb-2 block">
                               {activeLesson.lessonTypeRu ?? activeLesson.lessonType ?? activeLesson.type ?? 'Lesson'}
                             </span>
                             <h2 className="text-3xl md:text-4xl font-bold text-white font-display">{activeLesson.title}</h2>
                             {heroSubtitle && (
                               <p className="text-slate-300 text-base md:text-lg leading-relaxed mt-3">
                                 {heroSubtitle}
                               </p>
                             )}
                        </div>

                        <div className="prose prose-invert prose-lg prose-headings:font-display prose-p:text-slate-400 prose-strong:text-white max-w-none">
                            <p className="whitespace-pre-line leading-relaxed">
                                {activeLesson.description}
                            </p>
                        </div>

                        {examplesBlock && (
                          <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 space-y-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-200 font-bold flex items-center justify-center border border-purple-500/20 text-lg">
                                ✦
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wider text-purple-200 font-semibold">Examples</p>
                                <p className="text-2xl font-display font-semibold text-white leading-tight">
                                  {examplesBlock.title ?? 'Примеры'}
                                </p>
                                {examplesBlock.tip && (
                                  <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed max-w-3xl">
                                    {examplesBlock.tip}
                                  </p>
                                )}
                              </div>
                            </div>

                            {examplesBlock.items && examplesBlock.items.length > 0 && (
                              <div className="space-y-3">
                                {examplesBlock.items.map((item, idx) => {
                                  const label = (item.label ?? '').toLowerCase();
                                  const isBad = label.includes('плох');
                                  const accentClasses = isBad
                                    ? 'bg-[#0b1020] border-slate-700/40 text-slate-200'
                                    : 'bg-[#0c1a22] border-teal-500/25 text-teal-100';
                                  const badgeClasses = isBad
                                    ? 'bg-slate-700/40 text-slate-200 border border-slate-500/40'
                                    : 'bg-teal-500/20 text-teal-100 border border-teal-400/30';
                                  const noteColor = isBad ? 'text-slate-400' : 'text-teal-100/80';

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-4 rounded-xl border ${accentClasses} space-y-2`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {item.label && (
                                          <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${badgeClasses}`}>
                                            {item.label}
                                          </span>
                                        )}
                                      </div>
                                      {item.content && (
                                        <div className="rounded-lg bg-white/5 px-3 py-2 border border-white/5 relative">
                                          <button
                                            type="button"
                                            onClick={() => handleCopyExample(item.content, idx)}
                                            className="absolute top-2 right-2 text-[11px] uppercase tracking-wide px-2 py-1 rounded-md border border-white/10 text-slate-300 hover:border-vibe-400/40 hover:text-white transition-colors"
                                            style={{ cursor: item.content ? 'pointer' : 'default' }}
                                          >
                                            {copiedExample === idx ? 'Скопировано' : 'Копировать'}
                                          </button>
                                          <p className="text-sm text-white whitespace-pre-line leading-relaxed max-w-3xl pr-16">
                                            {item.content}
                                          </p>
                                        </div>
                                      )}
                                      {item.notes && item.notes.length > 0 && (
                                        <ul className="space-y-1.5 text-sm leading-snug list-disc list-inside">
                                          {item.notes.map((note, noteIdx) => (
                                            <li key={noteIdx} className={noteColor}>
                                              {note}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {quizBlock && (
                          <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-vibe-500/15 text-vibe-300 font-bold flex items-center justify-center border border-vibe-500/20">
                                ?
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider text-vibe-300 font-bold mb-1">Quiz</p>
                                <p className="text-xl font-display text-white leading-tight">
                                  {quizBlock.title ?? 'Мини-эксперимент'}
                                </p>
                              </div>
                            </div>
                            {quizBlock.question && (
                              <p className="text-slate-300 whitespace-pre-line leading-relaxed">{quizBlock.question}</p>
                            )}
                            {quizBlock.options && quizBlock.options.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {quizBlock.options.map((option, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleQuizSelect(idx, option)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                                      quizAnswer === idx
                                        ? 'bg-green-500/10 border-green-400/40 text-green-100'
                                        : 'bg-[#070c18] border-white/5 text-slate-200 hover:border-vibe-500/30 hover:bg-white/5'
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <span className="text-sm">{option}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {quizBlock.note && (
                              <div className="mt-4 text-xs text-slate-400 italic">Note: {quizBlock.note}</div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-12 flex justify-between items-center pt-8 border-t border-white/10">
                            <button 
                                disabled={activeLessonIndex === 0}
                                onClick={() => goToLesson(activeLessonIndex - 1)}
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 disabled:opacity-30 hover:bg-white/5 transition-colors font-bold text-sm"
                            >
                                Предыдущий
                            </button>
                            <button 
                                disabled={activeLessonIndex === course.lessons.length - 1}
                                onClick={() => goToLesson(activeLessonIndex + 1, { completeCurrent: true })}
                                className="px-6 py-2.5 rounded-xl bg-vibe-600 text-white font-bold hover:bg-vibe-500 transition-colors shadow-lg shadow-vibe-900/20 disabled:opacity-50 text-sm flex items-center gap-2"
                                data-action={ctaData.action ?? undefined}
                            >
                                {ctaData.buttonText ?? 'Следующий'} <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Interactive Window */}
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-t md:border-t-0 md:border-l border-white/5 bg-[#050914] z-10 shadow-2xl relative">
                    {/* IDE Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vibe-500/50 to-transparent"></div>
                    {renderRightPanel()}
                </div>

            </main>
        </div>
    </div>
  );
};
