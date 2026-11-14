import { useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { toAppError } from '../api/errors';
import { DistrictPicker } from '../components/DistrictPicker';
import { Message, Panel, formatDate } from '../components/analytics/OverviewUI';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { districtService } from '../services/districtService';
import { newsService } from '../services/newsService';
import { colors } from '../utils/theme';

const searchable = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Evita abrir esquemas javascript:, data:, intent:, etc. provenientes de una noticia. */
function isSafeArticleUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch { return false; }
}

export default function NewsScreen() {
  const { user } = useAuth();
  const [chosenId, setChosenId] = useState<number | null>(user?.districtId ?? null);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const districts = useFetch(signal => districtService.getAll(signal), []);
  // La API solo tiene endpoint por distrito. Si el usuario aún no eligió, usa el primero registrado.
  const districtId = chosenId ?? districts.data?.[0]?.id ?? null;
  const news = useFetch(signal => districtId === null ? Promise.resolve([]) : newsService.getByDistrict(districtId, signal), [districtId]);
  const canSync = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const selectedDistrict = districts.data?.find(d => d.id === districtId);

  const articles = useMemo(() => {
    const query = searchable(search.trim());
    return [...(news.data ?? [])]
      .filter(item => !query || searchable(`${item.title} ${item.summary ?? ''} ${item.source ?? ''}`).includes(query))
      .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
  }, [news.data, search]);

  const chooseDistrict = (id: number | null) => {
    setChosenId(id);
    setSyncMessage(null);
    setSyncError(null);
    setSearch('');
  };

  const sync = async () => {
    if (!canSync || districtId === null || syncing) return;
    setSyncing(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      await newsService.sync(districtId);
      setSyncMessage('Sincronización solicitada al servidor. Las noticias pueden tardar en aparecer; vuelve a pulsar Actualizar.');
      news.reload();
    } catch (err) {
      setSyncError(toAppError(err).message);
    } finally {
      setSyncing(false);
    }
  };

  const openArticle = async (url: string | null) => {
    if (!isSafeArticleUrl(url)) return;
    setLinkError(null);
    try {
      await Linking.openURL(url);
    } catch {
      setLinkError('No se pudo abrir el enlace de la noticia.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      refreshControl={<RefreshControl refreshing={news.loading && news.data !== null} onRefresh={news.reload} tintColor={colors.primary} />}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.title}>Noticias sobre dengue</Text>
      <Text style={s.muted}>Publicaciones recopiladas por el servidor para cada distrito. Consulta la fuente original antes de compartir información.</Text>

      {districts.error ? <Message text={districts.error.message} action="Reintentar" onAction={districts.reload} /> : null}
      <DistrictPicker label="Seleccionar distrito" value={districtId} onChange={chooseDistrict} districts={districts.data} loading={districts.loading} emptyLabel="Primer distrito disponible" />
      <TextInput
        style={s.search}
        placeholder="Buscar por título, contenido o fuente"
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        accessibilityLabel="Buscar noticias"
      />
      <PrimaryButton title="Actualizar noticias" variant="secondary" onPress={news.reload} disabled={districtId == null || news.loading} />
      {canSync ? (
        <PrimaryButton title="Solicitar sincronización de noticias" onPress={() => void sync()} loading={syncing} disabled={districtId == null} />
      ) : null}
      {syncMessage ? <Message text={syncMessage} /> : null}
      {syncError ? <Message text={syncError} /> : null}
      {linkError ? <Message text={linkError} /> : null}

      <Panel title={selectedDistrict ? `Noticias de ${selectedDistrict.name}` : 'Noticias del distrito'} subtitle={`${articles.length} noticia${articles.length === 1 ? '' : 's'} en el filtro actual`}>
        {news.loading ? <Text style={s.muted}>Consultando noticias…</Text> : null}
        {news.error ? <Message text={news.error.message} action="Reintentar" onAction={news.reload} /> : null}
        {!news.loading && !news.error && districtId === null ? <Text style={s.muted}>Selecciona un distrito para consultar sus noticias.</Text> : null}
        {!news.loading && !news.error && districtId !== null && articles.length === 0 ? (
          <Message text={search.trim() ? 'No encontramos noticias que coincidan con tu búsqueda.' : 'Todavía no hay noticias para este distrito. Puedes actualizar más tarde.'} />
        ) : null}
        {articles.map(article => {
          const validLink = isSafeArticleUrl(article.url);
          return (
            <View key={article.id} style={s.article}>
              <Text style={s.articleTitle}>{article.title}</Text>
              <Text style={s.meta}>{article.source?.trim() || 'Fuente no especificada'} · {formatDate(article.publishedAt)}</Text>
              {article.summary?.trim() ? <Text style={s.description}>{article.summary.trim()}</Text> : null}
              {validLink ? (
                <Pressable accessibilityRole="link" accessibilityLabel={`Abrir noticia: ${article.title}`} onPress={() => void openArticle(article.url)}>
                  <Text style={s.link}>Leer noticia original ↗</Text>
                </Pressable>
              ) : <Text style={s.muted}>Sin enlace disponible</Text>}
            </View>
          );
        })}
      </Panel>
      <Text style={s.note}>Las noticias son informativas y no sustituyen las alertas epidemiológicas oficiales.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 40, gap: 14, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  search: { borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: colors.surface, fontSize: 14, color: colors.text },
  article: { paddingVertical: 14, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  articleTitle: { fontSize: 16, fontWeight: '800', lineHeight: 22, color: colors.text },
  description: { color: colors.text, fontSize: 14, lineHeight: 21 },
  meta: { color: colors.textMuted, fontSize: 12 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
