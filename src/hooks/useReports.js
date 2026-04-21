import { useQuery } from '@tanstack/react-query';
import reportApi from '@api/reports';

export const useReport = (type, from, to, options = {}) => {
  return useQuery({
    queryKey: ['report', type, from, to],
    queryFn: () => reportApi.getReport(type, from, to),
    staleTime: 2 * 60 * 1000,
    enabled: !!type,
    ...options
  });
};
