<template>
  <div class="note-editor">
    <!-- Toolbar -->
    <div v-if="editor" class="editor-toolbar">
      <div class="toolbar-group">
        <button
          @click="editor!.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ active: editor!.isActive('heading', { level: 1 }) }"
          class="toolbar-btn"
          title="Heading 1"
        >
          H1
        </button>
        <button
          @click="editor!.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ active: editor!.isActive('heading', { level: 2 }) }"
          class="toolbar-btn"
          title="Heading 2"
        >
          H2
        </button>
        <button
          @click="editor!.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ active: editor!.isActive('heading', { level: 3 }) }"
          class="toolbar-btn"
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          @click="editor!.chain().focus().toggleBold().run()"
          :class="{ active: editor!.isActive('bold') }"
          class="toolbar-btn"
          title="Bold"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleItalic().run()"
          :class="{ active: editor!.isActive('italic') }"
          class="toolbar-btn"
          title="Italic"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h4m-2 0l-4 16m0 0h4" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleUnderline().run()"
          :class="{ active: editor!.isActive('underline') }"
          class="toolbar-btn"
          title="Underline"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v7a5 5 0 0010 0V4M5 21h14" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleStrike().run()"
          :class="{ active: editor!.isActive('strike') }"
          class="toolbar-btn"
          title="Strikethrough"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 4H9a3 3 0 00-3 3v0a3 3 0 003 3h6a3 3 0 013 3v0a3 3 0 01-3 3H6M4 12h16" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleHighlight().run()"
          :class="{ active: editor!.isActive('highlight') }"
          class="toolbar-btn"
          title="Highlight"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          @click="editor!.chain().focus().toggleBulletList().run()"
          :class="{ active: editor!.isActive('bulletList') }"
          class="toolbar-btn"
          title="Bullet List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleOrderedList().run()"
          :class="{ active: editor!.isActive('orderedList') }"
          class="toolbar-btn"
          title="Numbered List"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleTaskList().run()"
          :class="{ active: editor!.isActive('taskList') }"
          class="toolbar-btn"
          title="Checklist"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          @click="editor!.chain().focus().toggleBlockquote().run()"
          :class="{ active: editor!.isActive('blockquote') }"
          class="toolbar-btn"
          title="Quote"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().toggleCodeBlock().run()"
          :class="{ active: editor!.isActive('codeBlock') }"
          class="toolbar-btn"
          title="Code Block"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().setHorizontalRule().run()"
          class="toolbar-btn"
          title="Horizontal Rule"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12h18" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          @click="editor!.chain().focus().setTextAlign('left').run()"
          :class="{ active: editor!.isActive({ textAlign: 'left' }) }"
          class="toolbar-btn"
          title="Align Left"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M3 12h12M3 18h18" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().setTextAlign('center').run()"
          :class="{ active: editor!.isActive({ textAlign: 'center' }) }"
          class="toolbar-btn"
          title="Align Center"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M6 12h12M3 18h18" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().setTextAlign('right').run()"
          :class="{ active: editor!.isActive({ textAlign: 'right' }) }"
          class="toolbar-btn"
          title="Align Right"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M9 12h12M3 18h18" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <div class="toolbar-group">
        <button
          @click="editor!.chain().focus().undo().run()"
          :disabled="!editor!.can().undo()"
          class="toolbar-btn"
          title="Undo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H3" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6l-4 4 4 4" />
          </svg>
        </button>
        <button
          @click="editor!.chain().focus().redo().run()"
          :disabled="!editor!.can().redo()"
          class="toolbar-btn"
          title="Redo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h10" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 6l4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Placeholder.configure({
      placeholder: 'Start writing...',
    }),
    Highlight,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Image,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose max-w-none focus:outline-none',
    },
  },
  onUpdate: () => {
    emit('update:modelValue', editor.value!.getHTML())
  },
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, { emitUpdate: false })
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.note-editor {
  @apply flex flex-col h-full;
}

.editor-toolbar {
  @apply flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50/80 flex-wrap;
}

.toolbar-group {
  @apply flex items-center gap-0.5;
}

.toolbar-divider {
  @apply w-px h-5 bg-gray-300 mx-1;
}

.toolbar-btn {
  @apply p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed;
}

.toolbar-btn.active {
  @apply bg-gray-200 text-primary-600;
}

.editor-content {
  @apply flex-1 overflow-y-auto;
}

.editor-content :deep(.tiptap) {
  @apply p-6 min-h-full;
  outline: none;
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  @apply text-gray-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-content :deep(.tiptap h1) {
  @apply text-2xl font-bold mb-3 text-gray-900;
}

.editor-content :deep(.tiptap h2) {
  @apply text-xl font-semibold mb-2 text-gray-900;
}

.editor-content :deep(.tiptap h3) {
  @apply text-lg font-medium mb-2 text-gray-900;
}

.editor-content :deep(.tiptap p) {
  @apply mb-2 text-gray-700 leading-relaxed;
}

.editor-content :deep(.tiptap ul) {
  @apply list-disc pl-6 mb-2;
}

.editor-content :deep(.tiptap ol) {
  @apply list-decimal pl-6 mb-2;
}

.editor-content :deep(.tiptap li) {
  @apply mb-1;
}

.editor-content :deep(.tiptap blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3;
}

.editor-content :deep(.tiptap pre) {
  @apply bg-gray-900 text-gray-100 rounded-lg p-4 my-3 overflow-x-auto;
}

.editor-content :deep(.tiptap code) {
  @apply bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm;
}

.editor-content :deep(.tiptap pre code) {
  @apply bg-transparent text-gray-100 px-0 py-0;
}

.editor-content :deep(.tiptap hr) {
  @apply my-4 border-gray-200;
}

.editor-content :deep(.tiptap mark) {
  @apply bg-yellow-200 rounded px-0.5;
}

.editor-content :deep(.tiptap img) {
  @apply max-w-full rounded-lg my-3;
}

/* Task list styles */
.editor-content :deep(.tiptap ul[data-type="taskList"]) {
  @apply list-none pl-0;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li) {
  @apply flex items-start gap-2;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li label) {
  @apply flex items-center;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li label input[type="checkbox"]) {
  @apply w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer mt-0.5;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li div) {
  @apply flex-1;
}

.editor-content :deep(.tiptap ul[data-type="taskList"] li[data-checked="true"] div p) {
  @apply line-through text-gray-400;
}
</style>
