import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as yup from 'yup';
import { GenericForm, FormTextField } from '@/components/ui/generic-form';
import { useLoginMutation } from '@/queries/auth/mutations';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
});

type LoginValues = yup.InferType<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const login = useLoginMutation();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>HD Farm</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <GenericForm<LoginValues>
          schema={schema}
          defaultValues={{ email: '', password: '' }}
          onSubmit={(v) => login.mutateAsync(v)}
          onSuccess={() => router.replace('/(tabs)')}
          onError={(err) => Alert.alert('Login Error', err.message)}
          submitLabel="Sign In"
        >
          <FormTextField
            name="email"
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            required
          />
          <FormTextField
            name="password"
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            required
          />
        </GenericForm>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#1a7f37' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 6 },
});
