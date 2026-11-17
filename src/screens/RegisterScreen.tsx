import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { toAppError } from '../api/errors';
import { DistrictPicker } from '../components/DistrictPicker';
import { FormError } from '../components/FormError';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { districtService } from '../services/districtService';
import { PHONE_REGEX, toE164 } from '../utils/phone';
import { colors } from '../utils/theme';

const schema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa tu nombre completo'),
    email: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Repite tu contraseña'),
    phone: z.string().regex(PHONE_REGEX, 'Celular de 9 dígitos que empieza con 9').or(z.literal('')),
    districtId: z.number().nullable(),
  })
  .refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Las contraseñas no coinciden' });
type RegisterForm = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { register: registerUser } = useAuth();
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', phone: '', districtId: null },
  });

  const onSubmit = async ({ fullName, email, password, phone, districtId }: RegisterForm) => {
    setServerError(null);
    setFieldErrors([]);
    try {
      await registerUser({ fullName, email, password, phone: toE164(phone), districtId: districtId ?? undefined });
      Toast.show({ type: 'success', text1: '¡Cuenta creada!', text2: 'Bienvenido a DengueTrace.' });
    } catch (err) {
      const appError = toAppError(err, { 409: 'Ya existe una cuenta con ese correo.' });
      setServerError(appError.message);
      setFieldErrors(appError.fieldErrors);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Recibe alertas de dengue de tu distrito</Text>
        <FormError message={serverError} details={fieldErrors} />
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField label="Nombre completo" value={value} onChangeText={onChange} onBlur={onBlur} autoComplete="name" error={errors.fullName?.message} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Correo"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField label="Contraseña" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry hint="Mínimo 8 caracteres" error={errors.password?.message} />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField label="Repite la contraseña" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry error={errors.confirmPassword?.message} />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Celular (opcional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              placeholder="987654321"
              hint="Para recibir alertas por SMS"
              error={errors.phone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="districtId"
          render={({ field: { onChange, value } }) => (
            <DistrictPicker
              label="Distrito donde vives (opcional)"
              value={value}
              onChange={onChange}
              districts={districts.data}
              loading={districts.loading}
              error={districts.error?.message}
              onRetry={districts.reload}
            />
          )}
        />
        <PrimaryButton title="Crear cuenta" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        <Link href="/login" style={styles.link}>
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 24, paddingTop: 64, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: -8 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
