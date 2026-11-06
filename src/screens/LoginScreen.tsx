import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { toAppError } from '../api/errors';
import { FormError } from '../components/FormError';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../utils/theme';

const schema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});
type LoginForm = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      await login(values); // el guard de app/_layout.tsx lleva solo a las pestañas
      Toast.show({ type: 'success', text1: '¡Bienvenido!' });
    } catch (err) {
      setServerError(toAppError(err, { 401: 'Correo o contraseña incorrectos.' }).message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>DengueTrace</Text>
        <Text style={styles.title}>Inicia sesión</Text>
        <Text style={styles.subtitle}>Consulta el riesgo de dengue en tu distrito</Text>
        <FormError message={serverError} />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Correo"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="tu@correo.com"
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
            <TextField
              label="Contraseña"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              autoComplete="password"
              error={errors.password?.message}
            />
          )}
        />
        <PrimaryButton title="Ingresar" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
        <Link href="/register" style={styles.link}>
          ¿No tienes cuenta? Regístrate
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
  brand: { fontSize: 28, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: -8 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
