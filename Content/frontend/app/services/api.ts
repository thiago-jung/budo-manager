import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
});

// Interceptor para adicionar o token em cada requisição automaticamente
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("budo_token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    login: (email: string, senha: string) => api.post("/auth/login", { email, senha }),
};

export const alunosAPI = {
    listar: () => api.get("/alunos"),
    criar: (dados: any) => api.post("/alunos", dados),
};

export const pagamentosAPI = {
    listar: () => api.get("/pagamentos"),
    criar: (dados: any) => api.post("/pagamentos", dados),
};

export const eventosAPI = {
    criar: (dados: any) => api.post("/eventos", dados),
    listarMeus: () => api.get("/eventos/meus"),
    listarFeed: () => api.get("/eventos/feed"),
    inscrever: (eventoId: string, categoriaId: string) => api.post(`/eventos/${eventoId}/inscrever`, { categoria_id: categoriaId }),
    gerarChaves: (eventoId: string, categoriaId: string) => api.post(`/eventos/${eventoId}/gerar-chaves`, { categoria_id: categoriaId }),
};

export default api;
