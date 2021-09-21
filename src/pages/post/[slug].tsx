/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';

import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import Comments from '../../components/Comments';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navPost: {
    nextPost: {
      uid: string | null;
      title: string | null;
    };
    prevPost: {
      uid: string | null;
      title: string | null;
    };
  };
}

export default function Post({
  post,
  preview,
  navPost,
}: PostProps): JSX.Element {
  // TODO
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const postText = post.data.content.map(text => {
    return {
      heading: text.heading,
      body: RichText.asText(text.body),
    };
  });

  const totalWords = postText.reduce((accum, curr) => {
    return (
      accum + (curr.heading.split(/\s/g).length + curr.body.split(/\s/g).length)
    );
  }, 0);

  const timeReading = Math.ceil(totalWords / 200);

  return (
    <>
      <Header />

      <img className={styles.banner} src={post.data.banner.url} alt="banner" />

      <main className={commonStyles.container}>
        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.info}>
            <FiCalendar size="1.25rem" />
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                locale: ptBr,
              })}
            </time>
            <FiUser size="1.25rem" />
            <span>{post.data.author}</span>
            <FiClock size="1.25rem" />
            <span>{`${timeReading} min de leitura`}</span>
          </div>

          <div className={styles.editPostDate}>
            <time>
              {`* editado em ${
                post.last_publication_date &&
                format(new Date(post.last_publication_date), 'dd MMM uuuu', {
                  locale: ptBr,
                })
              } às ${
                post.last_publication_date &&
                format(new Date(post.last_publication_date), 'p', {
                  locale: ptBr,
                })
              }`}
              {}
            </time>
          </div>

          {post.data.content.map(content => (
            <div className={styles.postContent} key={content.heading}>
              <h2
                key={content.heading}
                className={styles.postHeading}
                dangerouslySetInnerHTML={{ __html: content.heading }}
              />

              <div
                className={styles.postBody}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </article>

        <div className={styles.divider} />

        <div className={styles.postNav}>
          {navPost.prevPost.uid ? (
            <div className={styles.previousPost}>
              <p>{navPost.prevPost.title}</p>
              <Link href={`/post/${navPost.prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          ) : (
            <div className={styles.previousPost} />
          )}

          {navPost.nextPost.uid ? (
            <div className={styles.nextPost}>
              <p>{navPost.nextPost.title}</p>
              <Link href={`/post/${navPost.nextPost.uid}`}>
                <a>Próximo post</a>
              </Link>
            </div>
          ) : (
            <div className={styles.nextPost} />
          )}
        </div>

        <Comments />

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  // TODO
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {}
  );

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  // TODO
  const post = await prismic.getByUID('posts', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const nextPostData = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      after: post.id,
    }
  );

  const prevPostData = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      after: post.id,
      orderings: '[document.last_publication_date]',
    }
  );

  const navPost = {
    nextPost: {
      uid: nextPostData.results[0]?.uid || null,
      title: nextPostData.results[0]?.data.title || null,
    },
    prevPost: {
      uid: prevPostData.results[0]?.uid || null,
      title: prevPostData.results[0]?.data.title || null,
    },
  };

  return {
    props: {
      post,
      preview,
      navPost,
    },
  };
};
