--
-- PostgreSQL database dump
--

\restrict 9f4WYSIqiXpettSBImO7uRh4NmWWsB4EosR3kIVEH1PsvvpN737pucd9o0BGdqr

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: user_roles; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_roles AS ENUM (
    'asistente',
    'veterinario'
);


ALTER TYPE public.user_roles OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: dogs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dogs (
    id character varying(36) NOT NULL,
    especie character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    raza character varying(100) NOT NULL,
    "fechaNacimiento" date,
    sexo character varying(20),
    estado character varying(20),
    owner_id character varying(36) NOT NULL
);


ALTER TABLE public.dogs OWNER TO postgres;

--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluations (
    id character varying(36) NOT NULL,
    fecha date NOT NULL,
    resultado character varying(100) NOT NULL,
    comentarios text,
    dog_id character varying(36) NOT NULL
);


ALTER TABLE public.evaluations OWNER TO postgres;

--
-- Name: owners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.owners (
    id character varying(36) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    dni character varying(8) NOT NULL,
    celular character varying(9),
    correo character varying(120) NOT NULL,
    direccion character varying(255),
    sexo character varying(20),
    "fechaNacimiento" date
);


ALTER TABLE public.owners OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(64) NOT NULL,
    password_hash character varying(128) NOT NULL,
    role public.user_roles NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: dogs dogs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dogs
    ADD CONSTRAINT dogs_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: owners owners_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_correo_key UNIQUE (correo);


--
-- Name: owners owners_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_dni_key UNIQUE (dni);


--
-- Name: owners owners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owners
    ADD CONSTRAINT owners_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: dogs dogs_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dogs
    ADD CONSTRAINT dogs_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.owners(id);


--
-- Name: evaluations evaluations_dog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_dog_id_fkey FOREIGN KEY (dog_id) REFERENCES public.dogs(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9f4WYSIqiXpettSBImO7uRh4NmWWsB4EosR3kIVEH1PsvvpN737pucd9o0BGdqr

