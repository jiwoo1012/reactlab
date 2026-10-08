import type {StudyItem} from '@/types/study'
import styles from './StudyCard.module.scss'

type Pro={
    item:StudyItem
}

const StudyCard = ({item}:Pro) => {
  return (
    <article className={styles.card}>
        <span className={styles.id}>{item.id}</span>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.description}>{item.description}</p>
    </article>
  )
}

export default StudyCard
