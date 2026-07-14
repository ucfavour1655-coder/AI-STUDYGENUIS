import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  FileText,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  X,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { useSubjects } from '@/lib/use-subjects';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Note } from '@/lib/types';

export default function NotesScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { subjects } = useSubjects();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('notes')
      .select('*, subject:subjects(*)')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setNotes(data as unknown as Note[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filteredNotes = notes.filter((note) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
    );
  });

  const openNewNote = () => {
    setEditingNote(null);
    setEditorVisible(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setEditingNote(null);
  };

  const handleSave = async (title: string, content: string, subjectId: string | null) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      subject_id: subjectId,
      updated_at: new Date().toISOString(),
    };

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(payload)
        .eq('id', editingNote.id);
      if (!error) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id
              ? {
                  ...n,
                  ...payload,
                  subject:
                    subjects.find((s) => s.id === subjectId) ?? null,
                }
              : n
          )
        );
      }
    } else {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...payload,
          is_pinned: false,
        })
        .select('*, subject:subjects(*)')
        .single();
      if (!error && data) {
        setNotes((prev) => [data as unknown as Note, ...prev]);
      }
    }

    setSaving(false);
    closeEditor();
  };

  const togglePin = async (note: Note) => {
    const newPinned = !note.is_pinned;
    // Optimistic update
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, is_pinned: newPinned } : n
      )
    );
    const { error } = await supabase
      .from('notes')
      .update({ is_pinned: newPinned, updated_at: new Date().toISOString() })
      .eq('id', note.id);
    if (error) {
      // Revert on error
      setNotes((prev) =>
        prev.map((n) =>
          n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n
        )
      );
    } else {
      // Re-sort: pinned first, then updated_at desc
      setNotes((prev) =>
        [...prev].sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
        })
      );
    }
  };

  const handleDelete = async (note: Note) => {
    // Optimistic removal
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (error) {
      // Re-add on error
      setNotes((prev) => {
        const copy = [...prev];
        copy.push(note);
        return copy.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        });
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNote = (note: Note) => (
    <Card key={note.id} style={styles.noteCard}>
      <TouchableOpacity
        style={styles.noteContent}
        onPress={() => openEditNote(note)}
        activeOpacity={0.8}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTitleRow}>
            {note.is_pinned && (
              <Pin size={14} color={colors.accent} fill={colors.accent} />
            )}
            <Text
              style={[
                styles.noteTitle,
                { color: colors.text },
                note.is_pinned && styles.noteTitlePinned,
              ]}
              numberOfLines={1}
            >
              {note.title || 'Untitled'}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.notePreview, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {note.content || 'No content'}
        </Text>

        <View style={styles.noteFooter}>
          {note.subject && (
            <View
              style={[
                styles.subjectTag,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <BookOpen size={11} color={colors.primary} />
              <Text
                style={[styles.subjectTagText, { color: colors.primary }]}
                numberOfLines={1}
              >
                {note.subject.name}
              </Text>
            </View>
          )}
          <Text style={[styles.noteDate, { color: colors.textTertiary }]}>
            {formatDate(note.updated_at)}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.noteActions}>
        <TouchableOpacity
          style={styles.noteActionBtn}
          onPress={() => togglePin(note)}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {note.is_pinned ? (
            <PinOff size={18} color={colors.accent} />
          ) : (
            <Pin size={18} color={colors.textTertiary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.noteActionBtn}
          onPress={() => handleDelete(note)}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
          >
            <FileText size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              My Notes
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={openNewNote}
          activeOpacity={0.7}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notes list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.centerContent}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <FileText size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              {searchQuery
                ? 'Try a different search term'
                : 'Tap the + button to create your first note'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={openNewNote}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create Note</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredNotes.map((note) => renderNote(note))
        )}
      </ScrollView>

      {/* Note editor modal */}
      <NoteEditor
        visible={editorVisible}
        note={editingNote}
        subjects={subjects}
        colors={colors}
        saving={saving}
        onClose={closeEditor}
        onSave={handleSave}
      />
    </View>
  );
}

// ---------- NoteEditor Component ----------

interface NoteEditorProps {
  visible: boolean;
  note: Note | null;
  subjects: { id: string; name: string; color: string }[];
  colors: ReturnType<typeof useTheme>['colors'];
  saving: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, subjectId: string | null) => void;
}

function NoteEditor({
  visible,
  note,
  subjects,
  colors,
  saving,
  onClose,
  onSave,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(note?.title ?? '');
      setContent(note?.content ?? '');
      setSubjectId(note?.subject_id ?? null);
    }
  }, [visible, note]);

  const canSave = title.trim().length > 0 || content.trim().length > 0;

  const handleSavePress = () => {
    if (!canSave || saving) return;
    onSave(title, content, subjectId);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          {/* Modal header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {note ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.modalCloseBtn,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              activeOpacity={0.6}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title input */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Title
            </Text>
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Note title"
              placeholderTextColor={colors.textTertiary}
              maxLength={100}
            />

            {/* Content textarea */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Content
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={content}
              onChangeText={setContent}
              placeholder="Write your note here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />

            {/* Subject picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Subject
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectChips}
            >
              <TouchableOpacity
                style={[
                  styles.subjectChip,
                  subjectId === null && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  subjectId !== null && {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSubjectId(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subjectChipText,
                    {
                      color: subjectId === null ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {subjects.map((s) => {
                const selected = subjectId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.subjectChip,
                      selected && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      !selected && {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSubjectId(s.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.subjectChipText,
                        {
                          color: selected ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ScrollView>

          {/* Save button */}
          <View
            style={[
              styles.modalFooter,
              { borderTopColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: canSave ? colors.primary : colors.border,
                },
              ]}
              onPress={handleSavePress}
              disabled={!canSave || saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {note ? 'Save Changes' : 'Create Note'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  noteCard: {
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  noteContent: {
    flex: 1,
  },
  noteHeader: {
    marginBottom: 6,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    flexShrink: 1,
  },
  noteTitlePinned: {
    flexShrink: 1,
  },
  notePreview: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 10,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: 140,
  },
  subjectTagText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  noteActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.05)',
  },
  noteActionBtn: {
    padding: 6,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    flex: 1,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    maxHeight: 420,
  },
  modalBodyContent: {
    padding: 20,
    gap: 8,
    paddingBottom: 12,
    flexGrow: 1,
    minHeight: 200,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    marginBottom: 4,
  },
  titleInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  contentInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    minHeight: 140,
    marginBottom: 16,
  },
  subjectChips: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },
  subjectChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
