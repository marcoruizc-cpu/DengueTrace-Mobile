import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { toAppError } from '../api/errors';
import { DistrictPicker } from '../components/DistrictPicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { districtService } from '../services/districtService';
import { userService } from '../services/userService';
import { PHONE_REGEX, toE164, toLocalPhone } from '../utils/phone';
import { colors } from '../utils/theme';

const ROLE_LABELS = { USER: 'Ciudadano', MODERATOR: 'Moderador', ADMIN: 'Administrador' } as const;

const schema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa tu nombre completo'),
    phone: z.string().regex(PHONE_REGEX, 'Celular de 9 dígitos que empieza con 9').or(z.literal('')),
    districtId: z.number().nullable(),
    preferredChannel: z.enum(['PUSH', 'SMS']),
    alertRadiusKm: z.string().regex(/^\d+$/, 'Ingresa un número entero').refine(v => Number(v) >= 1, 'Mínimo 1 km'),
  })
  .refine(d => d.preferredChannel !== 'SMS' || d.phone !== '', {
    path: ['phone'],
    message: 'Para recibir SMS necesitas registrar un celular',
  });
type ProfileForm = z.infer<typeof schema>;

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: toLocalPhone(user?.phone),
      districtId: user?.districtId ?? null,
      preferredChannel: user?.preferredChannel ?? 'PUSH',
      alertRadiusKm: String(user?.alertRadiusKm ?? 5),
    },
  });

  if (!user) return null;

  const onSubmit = async (values: ProfileForm) => {
    try {
      const updated = await userService.updateMe({
        fullName: values.fullName,
        phone: toE164(values.phone),
        districtId: values.districtId ?? undefined,
        preferredChannel: values.preferredChannel,
        alertRadiusKm: Number(values.alertRadiusKm),
      });
      setUser(updated);
      reset(values);
      Toast.show({ type: 'success', text1: 'Perfil actualizado' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'No se pudo guardar', text2: toAppError(err).message });
    }
  };

  const confirmLogout = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void logout() },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.muted}>{user.email}</Text>
        <Text style={styles.muted}>
          {ROLE_LABELS[user.role]} · {user.districtName ?? 'Sin distrito'}
        </Text>
        <Text style={[styles.pushStatus, { color: user.pushRegistered ? colors.success : colors.textMuted }]}>
          {user.pushRegistered ? 'Notificaciones push activas' : 'Push no registrado en este dispositivo'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mis datos y alertas</Text>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField label="Nombre completo" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.fullName?.message} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Celular"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              placeholder="987654321"
              hint="9 dígitos. Solo para alertas por SMS."
              error={errors.phone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="districtId"
          render={({ field: { onChange, value } }) => (
            <DistrictPicker
              label="Distrito donde vives"
              value={value}
              onChange={onChange}
              districts={districts.data}
              loading={districts.loading}
              emptyLabel="Sin elegir"
            />
          )}
        />
        <Controller
          control={control}
          name="preferredChannel"
          render={({ field: { onChange, value } }) => (
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>¿Cómo quieres recibir las alertas?</Text>
              <View style={styles.chips}>
                {(['PUSH', 'SMS'] as const).map(channel => (
                  <Pressable
                    key={channel}
                    onPress={() => onChange(channel)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: value === channel }}
                    style={[styles.chip, value === channel && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, value === channel && styles.chipTextActive]}>
                      {channel === 'PUSH' ? 'Notificación push' : 'SMS'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {value === 'PUSH' && !user.pushRegistered ? (
                <Text style={styles.warning}>Si no recibes notificaciones, elige SMS.</Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="alertRadiusKm"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Radio de alerta (km)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="number-pad"
              error={errors.alertRadiusKm?.message}
            />
          )}
        />
        <PrimaryButton title="Guardar cambios" onPress={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isDirty} />
      </View>

      <PrimaryButton title="Cerrar sesión" variant="secondary" onPress={confirmLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 },
  avatar: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: colors.primary },
  name: { textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { textAlign: 'center', color: colors.textMuted, marginTop: -8 },
  pushStatus: { textAlign: 'center', fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  label: { fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  warning: { color: colors.warning, fontSize: 12 },
});
