export const colors = {
  primary: '#1e3a5f',
  primaryDark: '#152a45',
  accent: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  bg: '#F3F4F6',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
};

export const styles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: (type) => ({
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: type === 'on-time' ? '#D1FAE5' : '#FEE2E2',
    color: type === 'on-time' ? '#065F46' : '#991B1B',
  }),
};
