import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteTestimonial, listContent, saveTestimonial, setTestimonialPublication } from "../api/contentApi.js";

export function useContentList(filters) {
  return useQuery({ queryKey: ["admin-content", filters], queryFn: () => listContent(filters), staleTime: 0 });
}
export function useContentMutations() {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: ["admin-content"] });
  const save = useMutation({ mutationFn: saveTestimonial, onSuccess, retry: false });
  const publish = useMutation({ mutationFn: setTestimonialPublication, onSuccess, retry: false });
  const remove = useMutation({ mutationFn: deleteTestimonial, onSuccess, retry: false });
  return { save, publish, remove };
}
